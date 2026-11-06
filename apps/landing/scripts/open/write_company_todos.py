#!/usr/bin/env python3
"""Atomically project the public company TODO into its existing metrics feed."""
import argparse, datetime, json, re
from pathlib import Path

# COMPANY_TODO.md is already a public-only source. Exclude its explicitly
# private lane wholesale; "Token/usage" and policy such as "no credentials"
# are ordinary public work text, not private evidence.
PRIVATE_LANE = re.compile(r'\bR-1\b|お笑い|q-comedy-r1', re.I)


def strip_cell(value):
    return re.sub(r'[*`]', '', value).strip()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('repository', type=Path)
    parser.add_argument('--usage-record', type=Path, required=True,
                        help='Actual CheckSubscriptionUsage output, not fixture')
    args = parser.parse_args()
    root = args.repository.resolve()
    text = (root / 'COMPANY_TODO.md').read_text(encoding='utf-8')
    rows = []
    for id, owner, action, done, status in re.findall(
            r'^\| (W\w+) \| ([^|]+?) \| ([^|]+?) \| ([^|]+?) \| ([^|]+?) \|$',
            text, re.M):
        if PRIVATE_LANE.search(' | '.join((owner, action, done, status))):
            continue
        cells = [strip_cell(value) for value in (owner, action, done, status)]
        # The second source table puts the action before its accepted proof.
        priority_cells = [cell for cell in cells if re.match(r'^P[12]\s*·\s*', cell)]
        if priority_cells:
            action_text = re.sub(r'^P[12]\s*·\s*', '', priority_cells[0])
            priority = int(priority_cells[0][1])
        else:
            action_text = cells[1]
            priority = 2
        rows.append({
            'priority': priority,
            'owner': cells[0],
            'action': action_text[:500],
            'quantity_goal': 'Accepted proof in public company TODO ' + id,
            'done_criteria': cells[2][:500],
            'last_evidence_public': cells[3][:500],
            'blocker_public': id + ' incomplete unless evidence-linked done; see public company TODO',
        })
    assert rows, 'No public work rows'

    usage = json.loads(args.usage_record.read_text(encoding='utf-8'))
    assert 0 <= usage['weekly_usage_percent'] <= 100
    for field in ['measured_at', 'timezone', 'weekly_usage_percent',
                  'grok_bot_share_percent', 'reset_at', 'plan', 'source', 'bots']:
        assert field in usage, field

    declared = re.search(
        r'^Updated: ([0-9]{4}-[0-9]{2}-[0-9]{2}) \(([^)]+)\)', text, re.M)
    assert declared, 'Public TODO must declare its update date and timezone'
    public_company_todo = {
        'repository': 'Daisuke134/anicca-products',
        'path': 'COMPANY_TODO.md',
        'system_owner': 'Grok Bot 参謀',
        'declared_updated': declared.group(1),
        'timezone': declared.group(2),
        'rows': len(rows),
        'source_updated_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

    path = root / 'apps/landing/public/open/metrics.json'
    feed = json.loads(path.read_text(encoding='utf-8'))
    feed['public_work'] = rows
    feed['usage_snapshot'] = usage
    feed['public_company_todo'] = public_company_todo
    temporary = path.with_suffix('.tmp')
    temporary.write_text(
        json.dumps(feed, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)
    print(json.dumps({
        'public_work': len(rows),
        'source_updated_at': public_company_todo['source_updated_at'],
        'source': public_company_todo,
        'path': str(path),
    }))


if __name__ == '__main__':
    main()
