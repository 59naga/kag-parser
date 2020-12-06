import { parseDOM } from "htmlparser2";

export default (rawText, options = {}) => {
  if (rawText == null) {
    return [];
  }

  const script = [];
  const lines = String(rawText).split("\n");
  lines.forEach((line, lineIndex) => {
    try {
      // ;〜〜 とか //〜〜 をコメントとして削除
      const text = line
        .trim()
        .replace(/^;[^\n]+/, "")
        .replace(/\/\/[^\n]+/g, "");
      if (!text.length) {
        return;
      }
      const isCoomand = text[0] === "@";
      if (isCoomand) {
        return pushScript(script, parseCommand(text.slice(1)), options);
      }

      const isLabel = text[0] === "*";
      if (isLabel) {
        return pushScript(script, parseLabel(text.slice(1)), options);
      }

      const chunks = parseMsg(text);
      chunks.forEach(chunk => pushScript(script, chunk, options));
    } catch (error) {
      // エラー発生行
      throw new Error(`${lineIndex + 1}: ${error.message}`);
    }
  });

  return script;
};

// html-tag形式に変換し、パーサーでhtmlタグとして構文を解析する
// うち、タグ名と属性をマージして返却
// foo bar=baz => {type:"foo", bar:"baz"}
function parseCommand(line) {
  const [{ name, attribs }] = parseDOM(`<${line.trim()} />`);
  if (attribs.type) {
    // [foo type=bar] は構文エラー
    throw new Error("typeは予約語なので、プロパティに使用できません");
  }
  // 引用符のありなしに関わらず "200" のような数値型の値をnumberへキャスト
  Object.keys(attribs).forEach(key => {
    const value = attribs[key];
    if (value === "") {
      return (attribs[key] = true);
    }
    if (value === "true") {
      return (attribs[key] = true);
    }
    if (value === "false") {
      return (attribs[key] = false);
    }
    if (typeof value === "string" && value.match(/^\d+$/)) {
      return (attribs[key] = Number(value));
    }
  });
  return { type: name, ...attribs };
}

function parseLabel(line) {
  const [name, title] = line.split(/\s*\|\s*/);
  return { type: "label", name, title };
}

function parseMsg(text) {
  const chunks = [];

  let openTag = -1;
  let closeTag = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "[" && text[i - 1] !== "\\") {
      openTag = i;
      const content = text.slice(closeTag, i);
      if (content.length) {
        chunks.push({ type: "msg", content });
      }
    }
    if (text[i] === "]" && text[i - 1] !== "\\") {
      closeTag = i + 1;
      if (openTag > -1) {
        chunks.push(parseCommand(text.slice(openTag + 1, i)));
      }
    }
  }
  if (!chunks.length) {
    chunks.push({ type: "msg", content: text });
  }

  return chunks;
}

function pushScript(script, token, options = {}) {
  // c# class用にプロパティをnull/stringで初期化する
  // TODO: 型。int型にstring突っ込もうとしてエラーにならないか
  if (options.props && options.props.length) {
    Object.keys(token).forEach(key => {
      const whitelist = ["type"].concat(options.props);
      if (whitelist.indexOf(key) === -1) {
        throw new Error(`プロパティ${key}は許可されていません`);
      }
    });
    options.props.forEach(prop => {
      token[prop] = token[prop] == null ? null : String(token[prop]);
    });
  }

  script.push(token);
}
