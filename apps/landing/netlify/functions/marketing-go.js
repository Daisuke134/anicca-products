const { makeMarketingGoHandler, makePostHogCapture, makeSupabasePersist } = require("./_lib/marketing-go");

const PRODUCTS = {
  ai: {
    productId: "aniccaios",
    kind: "app",
    appId: "6755129214",
    slug: "anicca",
    providerToken: "93486075",
    mediaType: "8",
  },
  ho: { productId: "honne", kind: "app", appId: "6759667221" },
  ej: { productId: "ebook-ja", kind: "web", path: "/achan" },
  ee: { productId: "ebook-en", kind: "web", path: "/monk" },
  hl: { productId: "hook-lab", kind: "capafy", agentId: "8123079349", ct: "hooklab_ig" },
};

exports.handler = async (event) => {
  const providerToken = process.env.ASC_VENDOR_NUMBER;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) // AFFILIATE_CTA_V2
    return { statusCode: 503, headers: { "cache-control": "no-store" }, body: "Attribution unavailable" };
  return makeMarketingGoHandler({
    products: PRODUCTS,
    providerToken: providerToken || "",
    persist: makeSupabasePersist({ url: supabaseUrl, serviceKey }),
    capturePostHog: makePostHogCapture(),
  })(event);
};
