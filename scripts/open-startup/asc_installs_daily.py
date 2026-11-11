#!/usr/bin/env python3
"""Build apps/landing/public/open/asc-installs-daily.json from App Store Connect
Sales reports (DAILY / SALES / SUMMARY). Installs = first-time downloads only
(product type 1/1F/1T/F1); redownloads (3/3F/3T/F3) and updates (7*) are separate.
RevenueCat "new customers" are NOT installs and are never used here.

Usage: asc_installs_daily.py OUT.json [--cache raw.json] [--since 2025-11-12]
Creds: $ANICCA_SECRETS/asc.env (ASC_KEY_ID, ASC_ISSUER_ID, ASC_VENDOR_NUMBER) + AuthKey_<kid>.p8.
No secret value is written to the output.
"""
import csv, gzip, io, json, os, sys, time, datetime as dt, concurrent.futures as cf
import jwt, requests

SECRETS = os.environ.get("ANICCA_SECRETS", "/workspace/.secrets")
FT = {"1", "1F", "1T", "F1"}; RD = {"3", "3F", "3T", "F3"}
APPS = {"6755129214": "Daily Affirmations - Anicca", "6759667221": "Honne",
        "6757726663": "Daily Dhamma", "6759514159": "Thankful - Gratitude Journal",
        "6762143790": "For Better Sleep - Sleep Reset", "6766485903": "STUDIO CHERIE"}

def env():
    e = dict(l.strip().split("=", 1) for l in open(f"{SECRETS}/asc.env") if "=" in l)
    p = f"{SECRETS}/AuthKey_{e['ASC_KEY_ID']}.p8"
    e["_key"] = open(p if os.path.exists(p) else f"{SECRETS}/AuthKey_646Y27MJ8C.p8").read()
    return e

def fetch(e, day):
    tok = jwt.encode({"iss": e["ASC_ISSUER_ID"], "iat": int(time.time()), "exp": int(time.time()) + 900,
                      "aud": "appstoreconnect-v1"}, e["_key"], algorithm="ES256", headers={"kid": e["ASC_KEY_ID"]})
    for i in range(4):
        try:
            r = requests.get("https://api.appstoreconnect.apple.com/v1/salesReports", timeout=40,
                             headers={"Authorization": "Bearer " + tok},
                             params={"filter[frequency]": "DAILY", "filter[reportType]": "SALES",
                                     "filter[reportSubType]": "SUMMARY", "filter[vendorNumber]": e["ASC_VENDOR_NUMBER"],
                                     "filter[reportDate]": day, "filter[version]": "1_1"})
            if r.status_code == 200:
                return day, 200, list(csv.DictReader(io.StringIO(gzip.decompress(r.content).decode()), delimiter="\t"))
            if r.status_code == 404:
                return day, 404, []
        except requests.RequestException:
            pass
        time.sleep(2 * (i + 1))
    return day, 0, None

def main():
    out = sys.argv[1]; a = sys.argv[2:]
    cache = a[a.index("--cache") + 1] if "--cache" in a else None
    since = dt.date.fromisoformat(a[a.index("--since") + 1] if "--since" in a else "2025-11-12")
    raw = json.load(open(cache)) if cache and os.path.exists(cache) else {}
    days = [(since + dt.timedelta(i)).isoformat() for i in range((dt.date.today() - since).days)]
    # Re-fetch anything not cached as 200, plus the last 3 days (late reports).
    todo = [d for d in days if raw.get(d, {}).get("status") != 200 or d >= days[-3]]
    if todo:
        e = env()
        with cf.ThreadPoolExecutor(6) as ex:
            for d, c, rows in ex.map(lambda d: fetch(e, d), todo):
                if rows is not None: raw[d] = {"status": c, "rows": rows}
    if cache: json.dump(raw, open(cache, "w"))
    reported = sorted(d for d in raw if raw[d]["status"] == 200)
    latest = reported[-1] if reported else None
    apps = {k: {"app_id": k, "name": v, "daily": {}} for k, v in APPS.items()}
    for d in days:
        if latest and d > latest: break
        for r in raw.get(d, {}).get("rows", []):
            k = r["Apple Identifier"]; t = r["Product Type Identifier"]; u = int(r["Units"])
            if t in FT or t in RD:
                if k not in apps: apps[k] = {"app_id": k, "name": r["Title"], "daily": {}}
                x = apps[k]["daily"].setdefault(d, {"first_time": 0, "redownload": 0})
                x["first_time" if t in FT else "redownload"] += u
    L = dt.date.fromisoformat(latest)
    def tot(app, n):
        lo = (L - dt.timedelta(n - 1)).isoformat() if n else "0000"
        return sum(v["first_time"] for d, v in app["daily"].items() if lo <= d <= latest)
    for app in apps.values():
        app["daily"] = dict(sorted(app["daily"].items()))
        app["totals"] = {"first_time_7d": tot(app, 7), "first_time_28d": tot(app, 28), "first_time_all_time": tot(app, 0),
                         "redownload_28d": sum(v["redownload"] for d, v in app["daily"].items()
                                               if (L - dt.timedelta(27)).isoformat() <= d <= latest)}
    doc = {"source": "App Store Connect Sales reports (DAILY SALES SUMMARY), first-time downloads = product types 1/1F/1T/F1; redownloads separate. Not RevenueCat.",
           "measured_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "latest_report_date": latest, "first_date": days[0],
           "note": "Days without a report row count as 0 installs (Apple returns 404 when there are no sales that day). Report dates are Apple's (PST-based) business days.",
           "apps": sorted(apps.values(), key=lambda x: -x["totals"]["first_time_all_time"])}
    json.dump(doc, open(out, "w"), separators=(",", ":"))
    print(out, latest, {a["name"]: a["totals"] for a in doc["apps"]})

if __name__ == "__main__":
    main()
