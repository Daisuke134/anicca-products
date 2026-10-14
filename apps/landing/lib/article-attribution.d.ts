export type ArticleAttribution = {
  text: string;
  x_handle?: string;
};

export declare function resolveArticleAttribution(value: unknown): {
  text: string | null;
  xHandle: string | null;
};
