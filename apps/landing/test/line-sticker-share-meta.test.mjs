import test from "node:test";
import assert from "node:assert/strict";

let shareMetaModule = {};
try {
  shareMetaModule = await import("../lib/line-sticker-share-meta.ts");
} catch (error) {
  if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
}

const buildLineStickerShareMetadata = shareMetaModule.buildLineStickerShareMetadata;
const stickerPost = {
  slug: "line-sticker-set-018-2026-10-14-08",
  title: "星くずカワウソの毎日【文字入り】 vol.4",
  description: "毎日使えるカワウソのLINEスタンプ。",
  markdown: "[LINE STOREでスタンプを見る](https://line.me/S/sticker/37254973)",
};

test("LINE sticker article share card uses the existing product's official image", () => {
  const metadata = buildLineStickerShareMetadata?.(stickerPost) ?? {};
  const productImage = "https://stickershop.line-scdn.net/stickershop/v1/product/37254973/LINEStorePC/main.png?v=1";

  assert.equal(metadata.openGraph?.title, stickerPost.title);
  assert.equal(metadata.openGraph?.url, "https://aniccaai.com/blog/" + stickerPost.slug);
  assert.deepEqual(metadata.openGraph?.images, [{ url: productImage, alt: stickerPost.title }]);
  assert.equal(metadata.twitter?.card, "summary_large_image");
  assert.deepEqual(metadata.twitter?.images, [productImage]);
});

test("non-sticker articles and sticker articles without an official LINE CTA get no sticker card", () => {
  assert.deepEqual(buildLineStickerShareMetadata?.({
    ...stickerPost,
    slug: "unrelated-article",
  }) ?? {}, {});
  assert.deepEqual(buildLineStickerShareMetadata?.({
    ...stickerPost,
    markdown: "No store link here.",
  }) ?? {}, {});
});
