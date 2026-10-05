export type CheckoutLang = 'en' | 'jp';
export type CheckoutProduct = 'ebook' | 'letter';
export type CheckoutMode = 'payment' | 'subscription';

export function isAttributionTokenForLang(token: unknown, lang: CheckoutLang): token is string;

export function buildCheckoutRequest(input: {
  search?: string;
  lang: CheckoutLang;
  product: CheckoutProduct;
  mode: CheckoutMode;
}): {
  lang: CheckoutLang;
  product: CheckoutProduct;
  mode: CheckoutMode;
  attribution_token?: string;
};
