const { randomUUID } = require("node:crypto");
const { classifyClick, makePostHogCapture } = require("./_lib/marketing-go");

// Per-ct pageview for /lm/guide. Called by a beacon on the page, so IP/UA are the visitor's.
// Human views -> lm_guide_view; test_ ct, AniccaCheck UA, x-anicca-check, bots -> lm_guide_view_nonhuman.
const capture = makePostHogCapture();
const clip = (v, n) => String(v ?? "").slice(0, n);

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  const ct = clip(q.ct, 120).trim() || "none";
  const view = classifyClick(event, ct);
  const human = view.trafficClass === "human";
  try {
    await capture({
      distinctId: randomUUID(),
      event: human ? "lm_guide_view" : "lm_guide_view_nonhuman",
      properties: {
        ct,
        path: clip(q.path || "/lm/guide", 200),
        referrer: clip(q.ref, 300),
        ...(q.utm_source && { utm_source: clip(q.utm_source, 120) }),
        ...(q.utm_campaign && { utm_campaign: clip(q.utm_campaign, 120) }),
        human,
        traffic_class: view.trafficClass,
        bot_reason: view.reason,
        user_agent: view.ua.slice(0, 400),
        ...(view.ip && { $ip: view.ip }),
        ...(view.ua && { $raw_user_agent: view.ua.slice(0, 400) }),
        $process_person_profile: false,
      },
    });
  } catch (error) {
    console.error(`lm-guide-view capture failed ct=${ct}: ${error.message}`);
  }
  return { statusCode: 204, headers: { "cache-control": "no-store" }, body: "" };
};
