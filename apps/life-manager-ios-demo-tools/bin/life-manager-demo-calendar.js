#!/usr/bin/env node

import fs from "node:fs";
import {
  cleanupDemoEvent,
  createDemoEvent,
  runGog,
} from "../lib/demo-event.js";

function usage() {
  return [
    "Usage:",
    "  node bin/life-manager-demo-calendar.js create [--live] [--receipt PATH]",
    "  node bin/life-manager-demo-calendar.js cleanup --receipt PATH",
    "",
    "create is preview-only unless --live is explicit. The live path requires authenticated gog.",
  ].join("\n");
}

function parseArgs(argv) {
  const flags = { live: false, receipt: null, now: undefined, gogBinary: undefined };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--live") flags.live = true;
    else if (arg === "--receipt") flags.receipt = argv[++index];
    else if (arg === "--now") flags.now = argv[++index];
    else if (arg === "--gog-bin") flags.gogBinary = argv[++index];
    else if (arg === "-h" || arg === "--help") flags.help = true;
    else throw new Error("unknown_option");
  }
  if (flags.receipt === "" || flags.now === "" || flags.gogBinary === "") throw new Error("option_value_missing");
  return flags;
}

function writeReceipt(path, receipt) {
  if (!path) return;
  fs.writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
}

function print(value, stream = process.stdout) {
  stream.write(`${JSON.stringify(value)}\n`);
}

function main(argv) {
  const [action, ...rest] = argv;
  if (!action || action === "--help" || action === "-h") {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  const flags = parseArgs(rest);
  if (flags.help) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }

  if (action === "create") {
    let result;
    try {
      result = createDemoEvent({
        now: flags.now ? new Date(flags.now) : new Date(),
        live: flags.live,
        runGog: (args, options) => runGog(args, { ...options, gogBinary: flags.gogBinary }),
        gogBinary: flags.gogBinary,
      });
    } catch (error) {
      if (error.receipt) {
        writeReceipt(flags.receipt, error.receipt);
        print(error.receipt);
        return 1;
      }
      print({ status: "failed", error: error.message }, process.stderr);
      return 1;
    }
    if (result.status === "created") writeReceipt(flags.receipt, result);
    print(result);
    return result.status === "not_created" ? 2 : 0;
  }

  if (action === "cleanup") {
    if (!flags.receipt) throw new Error("cleanup_requires_receipt");
    let receipt;
    try {
      receipt = JSON.parse(fs.readFileSync(flags.receipt, "utf8"));
      const result = cleanupDemoEvent({
        receipt,
        runGog: (args, options) => runGog(args, { ...options, gogBinary: flags.gogBinary }),
        gogBinary: flags.gogBinary,
      });
      print(result);
      return 0;
    } catch (error) {
      print({ status: "failed", error: error.message }, process.stderr);
      return 1;
    }
  }

  throw new Error("unknown_action");
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  print({ status: "failed", error: error.message }, process.stderr);
  process.exitCode = 1;
}
