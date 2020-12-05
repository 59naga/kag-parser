import parse from "./";
import { deepStrictEqual, throws } from "assert";

const text1 = `
@wait time=200
@cm
こんにちは。[l][r]
ごきげんよろしゅう。[l][r]
改ページしますよ。[p]
@cm
改ページしました。;コメントじゃないです
`;

const text2 = `
[image storage="bg0" page=fore layer=base]
[wait time=200]
[cm]
こんにちは。
`;

const text3 = `
[image storage="bg0" page=fore layer=base]
[wait time=200]
[cm]
[image layer=0 page=fore storage="asm" visible=true left=340 top=100]
こんにちは。
`;

const text4 = `
[wait time=200]
[cm]
[playbgm storage="e:3"]
再生中・・・停止するにはクリックしてください。[l]
[stopbgm]
`;

const text5 = `
[wait time=200]
[cm]
効果音を鳴らします。[l]
[playse storage=se1.wav][ws canskip]
`;

describe("吉里吉里構文解析すべき", () => {
  // http://www.ultrasync.net/dee/kr2helps/kag3doc/contents/index.html
  describe("チュートリアル", () => {
    it("文字を表示しよう", () => {
      const script = parse(text1);
      deepStrictEqual(script, [
        { type: "wait", time: 200 },
        { type: "cm" },
        { type: "msg", content: "こんにちは。" },
        { type: "l" },
        { type: "r" },
        { type: "msg", content: "ごきげんよろしゅう。" },
        { type: "l" },
        { type: "r" },
        { type: "msg", content: "改ページしますよ。" },
        { type: "p" },
        { type: "cm" },
        { type: "msg", content: "改ページしました。;コメントじゃないです" }
      ]);
    });
    it("背景を表示しよう", () => {
      const script = parse(text2);
      deepStrictEqual(script, [
        { type: "image", storage: "bg0", page: "fore", layer: "base" },
        { type: "wait", time: 200 },
        { type: "cm" },
        { type: "msg", content: "こんにちは。" }
      ]);
    });
    it("前景を表示しよう", () => {
      const script = parse(text3);
      deepStrictEqual(script, [
        { type: "image", storage: "bg0", page: "fore", layer: "base" },
        { type: "wait", time: 200 },
        { type: "cm" },
        {
          type: "image",
          layer: 0,
          page: "fore",
          storage: "asm",
          visible: true,
          left: 340,
          top: 100
        },
        { type: "msg", content: "こんにちは。" }
      ]);
    });
    it("BGM を使おう", () => {
      const script = parse(text4);
      deepStrictEqual(script, [
        { type: "wait", time: 200 },
        { type: "cm" },
        { type: "playbgm", storage: "e:3" },
        {
          type: "msg",
          content: "再生中・・・停止するにはクリックしてください。"
        },
        { type: "l" },
        { type: "stopbgm" }
      ]);
    });
    it("効果音を使おう", () => {
      const script = parse(text5);
      deepStrictEqual(script, [
        { type: "wait", time: 200 },
        { type: "cm" },
        { type: "msg", content: "効果音を鳴らします。" },
        { type: "l" },
        { type: "playse", storage: "se1.wav" },
        { type: "ws", canskip: true }
      ]);
    });
  });
});

describe("Unity用のオプション", () => {
  describe("type, propsを特定のものに制限し、propsはnullで初期化すべき", () => {
    it("どんなtokenであれ、指定のpropsはnullで初期化すべき", () => {
      const script = parse("foo", {
        props: ["time", "content", "storage", "layer", "left", "top", "layer", "loop", "buf"]
      });
      deepStrictEqual(script, [
        {
          type: "msg",
          content: "foo",
          time: null,
          storage: null,
          layer: null,
          left: null,
          top: null,
          loop: null,
          buf: null
        }
      ]);
    });
    it("指定のprops以外が存在するときエラーとすべき", () => {
      throws(() => {
        parse("@foo bar", {
          props: ["time", "content", "storage", "layer", "left", "top", "layer", "loop", "buf"]
        });
      }, {
        name: 'Error',
        message: '1: プロパティbarは許可されていません'
      });
    });
  });
});
