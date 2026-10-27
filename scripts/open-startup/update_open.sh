#!/usr/bin/env bash
# Daily: regenerate public metrics JSON and publish to anicca-open.surge.sh (read by aniccaai.com/open).
set -euo pipefail
D=/workspace/team/scripts/open; S=$D/site; mkdir -p $S
python3 $D/build_open_metrics.py $S/metrics.json
echo '*' > $S/CORS
cp $D/index.html $S/index.html
TOKEN=$(grep -m1 "^TOKEN=" /workspace/.secrets/surge_games | cut -d= -f2-)
SURGE_LOGIN=lifemanager.jp+games@agentmail.to SURGE_TOKEN="${TOKEN:?}" surge $S anicca-open.surge.sh >/tmp/open-surge.log 2>&1
curl -fsS https://anicca-open.surge.sh/metrics.json | python3 -c "import json,sys;d=json.load(sys.stdin);print('published',d['updated_at'],'MRR',d['totals']['mrr_usd'])"
