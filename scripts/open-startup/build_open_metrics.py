#!/usr/bin/env python3
"""Build Anicca's public open-startup metrics JSON (aniccaai.com/open).
Reads only internal files on the box and emits a PUBLIC-SAFE whitelist:
numbers + curated role/product labels. No free text from BOARD/CFO files is copied,
so no client names, addresses, emails, bank/cash, salary, card, LINE or family data can leak.
Usage: build_open_metrics.py OUT.json"""
import csv, json, re, sys, glob, os, datetime as dt
T='/workspace/team'; JST=dt.timezone(dt.timedelta(hours=9)); now=dt.datetime.now(JST); today=now.date()
GOAL_MRR=10000
def jload(p):
    try: return json.load(open(p))
    except Exception: return None
def latest(globpat):
    fs=sorted(glob.glob(globpat)); return fs[-1] if fs else None
missing=[]

# ---- revenue from the CFO revenue history (dated rows only) ----
rev_by_src={}; mtd=0.0; l30=0.0; have_hist=False
try:
    for r in csv.DictReader(open(f'{T}/cfo/history.csv')):
        if r['kind']!='revenue': continue
        have_hist=True
        try: d=dt.date.fromisoformat(r['date'][:10]) if len(r['date'])>=10 and '~' not in r['date'] else None
        except ValueError: d=None
        amt=float(r['amount_usd'] or 0); src=r['source'].split(':')[0]
        if d and d.year==today.year and d.month==today.month: mtd+=amt; rev_by_src[src]=rev_by_src.get(src,0)+amt
        if d and 0<=(today-d).days<30: l30+=amt
except Exception: pass
if not have_hist: missing.append('revenue history')

# ---- MRR + subs from the latest CFO ledger (RevenueCat API) ----
led=jload(latest(f'{T}/cfo/ledger/*.json') or '') or {}
mrr_anicca=None; capafy_lifetime=None
for r in led.get('revenue',[]):
    if r.get('deduped_out'): continue
    if r.get('mrr') is not None and 'RevenueCat' in r.get('business',''): mrr_anicca=float(r['mrr'])
    if r.get('business')=='Capafy' and r.get('period_kind')=='lifetime': capafy_lifetime=r.get('amount_usd')
mled=jload(latest('/workspace/marketing/cfo/ledger/*.json') or '') or {}
mm=mled.get('metrics',{})
def mv(k): v=mm.get(k) or {}; return v.get('v') if v.get('status')=='verified' else None
if mrr_anicca is None: mrr_anicca=mv('rc_mrr')
subs=mv('rc_active_subscriptions'); site_pv=mv('site_pageviews_total'); appstore_clicks=mv('app_store_clicks_total')
# Honne MRR is only reported in PRODUCT-LOOPS ("Honne $4 MRR")
pl=open(f'{T}/PRODUCT-LOOPS.md').read() if os.path.exists(f'{T}/PRODUCT-LOOPS.md') else ''
m=re.search(r'Honne \$(\d+(?:\.\d+)?) MRR',pl); mrr_honne=float(m.group(1)) if m else None
if mrr_anicca is None: missing.append('Anicca MRR')
mrr_total=sum(x for x in (mrr_anicca,mrr_honne) if x is not None)

# ---- distribution metrics ----
capafy_installs=None
try:
    rows=[r for r in csv.DictReader(open(f'{T}/gig-metrics.csv')) if r['platform']=='capafy' and r['listing_id']=='TOTAL']
    if rows: capafy_installs=int(rows[-1]['inquiries'] or 0)
except Exception: pass
xf={}
try:
    for r in csv.DictReader(open(f'{T}/metrics/x-followers.csv')): xf[r['handle']]=int(r['followers'])
except Exception: pass
muse=jload(f'{T}/metrics/agents/muse.json') or {}
social_views_7d=sum((a.get('views_7d') or 0) for a in muse.get('accounts',[])) or None
social_accounts=len(muse.get('accounts',[])) or None
pb=None
m=re.search(r'PromptBase \| \$0 \| [^|]*\| (\d+) views/7d',open(f'{T}/SCOREBOARD.md').read()) if os.path.exists(f'{T}/SCOREBOARD.md') else None
if m: pb=int(m.group(1))

def n(v): return v if v is not None else None
B=[ # curated, public-safe labels; numbers filled from sources above
 dict(name='Contract work (freelance platforms)',owner='COO',revenue_mtd=round(rev_by_src.get('coconala',0),2),mrr=None,metric='proposals sent daily',metric_value=None,status='live'),
 dict(name='Anicca iOS (affirmation app)',owner='CTO / CMO',revenue_mtd=round(rev_by_src.get('revenuecat',0),2),mrr=mrr_anicca,metric='paying subscribers',metric_value=subs,status='live, update in review'),
 dict(name='Honne family apps (Honne, Thankful, Daily Dhamma, Sleep Reset)',owner='CTO / CMO',revenue_mtd=None,mrr=mrr_honne,metric='—',metric_value=None,status='live'),
 dict(name='Capafy agents (Clip Map, Hook Lab)',owner='CTO / COO',revenue_mtd=None,revenue_lifetime=capafy_lifetime,mrr=None,metric='installs (cumulative)',metric_value=capafy_installs,status='live'),
 dict(name='Monk e-book / Anicca Reset',owner='CMO (Muse)',revenue_mtd=0,mrr=None,metric='social views, 7d (monk + app accounts)',metric_value=social_views_7d,status='live'),
 dict(name='AI Monk Factory / Monk Database (web)',owner='CTO / CMO',revenue_mtd=0,mrr=None,metric='site pageviews (cumulative)',metric_value=site_pv,status='live'),
 dict(name='PromptBase prompts',owner='Digital products',revenue_mtd=0,mrr=None,metric='listing views, 7d',metric_value=pb,status='live'),
 dict(name='LINE stickers',owner='Digital products',revenue_mtd=0,mrr=None,metric='—',metric_value=None,status='live'),
 dict(name='note / Substack writing',owner='Digital products',revenue_mtd=0,mrr=None,metric='—',metric_value=None,status='starting'),
 dict(name='Life Manager Cloud',owner='CTO',revenue_mtd=0,mrr=0,metric='—',metric_value=None,status='building, test billing'),
 dict(name='The Manager (AI that ends suffering)',owner='Head of Research',revenue_mtd=0,mrr=0,metric='X followers (@diceai0)',metric_value=xf.get('diceai0'),status='research'),
 dict(name='Accelerators, hackathons, grants',owner='CEO',revenue_mtd=None,mrr=None,metric='—',metric_value=None,status='applying'),
]
# ---- what each agent works on (curated by role; activity count from BOARD.md today) ----
board=open(f'{T}/BOARD.md').read().splitlines() if os.path.exists(f'{T}/BOARD.md') else []
td=today.isoformat(); tl=[l for l in board if td in l[:30]]
def cnt(*pats): return sum(1 for l in tl if any(p.lower() in l.lower() for p in pats))
A=[
 dict(agent='参謀 (CEO)',today='Goals, ROI ranking, fundraising and hackathon applications, X distribution',board_updates_today=cnt('参謀','sanbo','sanbou')),
 dict(agent='Muse (CMO)',today='Monk videos on Instagram/TikTok, e-book funnel, competitor-to-script loop',board_updates_today=cnt('muse')),
 dict(agent='Dots (COO)',today='Contract-work proposals and listings, marketplace research',board_updates_today=cnt('dots')),
 dict(agent='Codex (CTO, acting)',today='Product builds and releases: Anicca iOS update, Capafy pricing, Manager research PR',board_updates_today=cnt('codex','chatgpt')),
 dict(agent='Claude (engineering)',today='Paused until Oct 30 (weekly limit); work handed to Codex',board_updates_today=cnt('claude')),
 dict(agent='Life Manager (cloud ops)',today='Life Manager Cloud: test-mode billing and end-to-end checks',board_updates_today=cnt('life manager','life-manager','LM ')),
]
out=dict(
 updated_at=now.strftime('%Y-%m-%d %H:%M JST'),
 mission='Build the manager, an AI that ends suffering in this world.',
 goal=dict(mrr_usd=GOAL_MRR,current_mrr_usd=mrr_total,progress_pct=round(100*mrr_total/GOAL_MRR,2)),
 totals=dict(revenue_mtd_usd=round(mtd,2),revenue_last30d_usd=round(l30,2),mrr_usd=mrr_total,currency='USD'),
 businesses=B, agents=A,
 notes='Revenue = money received (USD at daily FX). null = not measured yet. Updated daily ~21:05 JST.',
 missing=missing)
# ---- final safety scrub: refuse to publish anything that looks private ----
s=json.dumps(out,ensure_ascii=False)
bad=[r'[\w.+-]+@[\w-]+\.[\w.]+', r'sk_(live|test)_', r'rk_live', r'\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b', r'(?i)bank|salary|cash_usd|runway|password|token']
for p in bad:
    if re.search(p,s): sys.exit(f'refusing to publish: matched {p}')
json.dump(out,open(sys.argv[1] if len(sys.argv)>1 else '/dev/stdout','w'),ensure_ascii=False,indent=1)
