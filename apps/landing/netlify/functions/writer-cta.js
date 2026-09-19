const { makeWriterCtaHandler } = require("./_lib/writer-cta");
const { makeSupabasePersist } = require("./_lib/marketing-entry");
exports.handler = async (event) => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { statusCode: 503, body: "Entry receipt unavailable" };
  return makeWriterCtaHandler({ persist: makeSupabasePersist({ url, serviceKey: key }) })(event);
};
// WRITER_ATTRIBUTION_V1
