import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {};

export default withSentryConfig(nextConfig, {
  org: "anicca",
  project: "deepwork-fm",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
});
