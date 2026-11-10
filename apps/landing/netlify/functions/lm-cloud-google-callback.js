"use strict";

const { eventRawQuery, proxyCloudAuthCallback } = require("./_lib/lm-cloud-auth-start");

exports.handler = async function handler(event) {
  const method = String(event && event.httpMethod || "GET").toUpperCase();
  if (method !== "GET") {
    return {
      statusCode: 405,
      headers: { allow: "GET", "cache-control": "no-store" },
      body: "",
    };
  }
  const result = await proxyCloudAuthCallback({
    headers: event && event.headers || {},
    rawQuery: eventRawQuery(event),
  });
  return {
    statusCode: result.statusCode,
    headers: result.headers,
    multiValueHeaders: result.cookies && result.cookies.length ? { "set-cookie": result.cookies } : undefined,
    body: result.body || "",
  };
};
