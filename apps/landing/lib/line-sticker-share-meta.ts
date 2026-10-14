import type { Metadata } from "next";

type LineStickerPost = {
  slug: string;
  title: string;
  description: string;
  markdown: string;
};

export function buildLineStickerShareMetadata(
  post: LineStickerPost,
): Pick<Metadata, "openGraph" | "twitter"> {
  if (!post.slug.startsWith("line-sticker-set-")) return {};

  const match = /https:\/\/line\.me\/S\/sticker\/(\d{5,12})(?=[?#\s)]|$)/i.exec(post.markdown);
  if (!match) return {};

  const url = "https://aniccaai.com/blog/" + post.slug;
  const image =
    "https://stickershop.line-scdn.net/stickershop/v1/product/" +
    match[1] +
    "/LINEStorePC/main.png?v=1";
  return {
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      siteName: "Anicca Articles",
      type: "article",
      images: [{ url: image, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [image],
    },
  };
}
