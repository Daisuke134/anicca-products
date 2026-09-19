const { makeWriterCtaHandler } = require("./_lib/writer-cta");
const { makeSupabasePersist } = require("./_lib/marketing-entry");

exports.handler = async (event) => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const persist = url && key ? makeSupabasePersist({ url, serviceKey: key }) : async () => {};
  return makeWriterCtaHandler({ persist })(event);
};
// WRITER_ATTRIBUTION_V2
