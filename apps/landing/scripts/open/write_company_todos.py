#!/usr/bin/env python3
"""Project the public company TODO into /open without rewriting finance metrics.

The scheduled finance refresh replaces apps/landing/public/open/metrics.json
wholesale and drops keys it does not emit. public_work was absent after those
refreshes (not an empty array). This writer:

- rebuilds the 29 public rows from COMPANY_TODO.md (private #15 excluded)
- writes them to company-todo.json, which the finance refresh does not own
- splices the same projection onto the end of metrics.json, leaving every
  other top-level value byte-identical
"""
import argparse, datetime, json, re
from pathlib import Path

PRIVATE_LANE = re.compile(r'\bR-1\b|お笑い|q-comedy-r1', re.I)
PROJECTION_KEYS = ('public_work', 'usage_snapshot', 'public_company_todo')
TOP_LEVEL_KEY = re.compile(r'(?m)^ "([^"]+)": ')


def strip_cell(value):
    return re.sub(r'[*`]', '', value).strip()


def project_rows(text):
    rows = []
    for match in re.finditer(r'^\| (\d{1,2}) \| ([^|]+?) \| ([^|]+?) \| ([^|]+?) \|[ \t]*$', text, re.M):
        number, todo, owner, evidence = match.groups()
        number = int(number)
        if not 1 <= number <= 30 or PRIVATE_LANE.search(match.group(0)):
            continue
        rows.append(dict(
            priority=number,
            owner=strip_cell(owner),
            action=strip_cell(todo)[:500],
            quantity_goal=f'Accepted proof in public COMPANY_TODO.md priority {number}',
            done_criteria='Only evidence-backed DONE; preparation/draft/tests are not outcomes.',
            last_evidence_public=strip_cell(evidence)[:500],
            blocker_public=f'Priority {number}: no DONE proof',
        ))
    expected = [i for i in range(1, max(r['priority'] for r in rows) + 1) if i != 15]
    if not rows or [r['priority'] for r in rows] != expected:
        raise SystemExit('Original 1-based order must not be renumbered')
    return rows


def projection_source(text, rows):
    declared = re.search(r'^Updated: ([0-9]{4}-[0-9]{2}-[0-9]{2}) \(([^)]+)\)', text, re.M)
    if not declared:
        raise SystemExit('COMPANY_TODO.md is missing Updated: YYYY-MM-DD (timezone)')
    return {
        'repository': 'Daisuke134/anicca-products',
        'path': 'COMPANY_TODO.md',
        'system_owner': 'Grok Bot 参謀',
        'declared_updated': declared.group(1),
        'timezone': declared.group(2),
        'rows': len(rows),
        'source_updated_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }


def load_usage(path):
    usage = json.loads(Path(path).read_text(encoding='utf-8'))
    if not 0 <= usage['weekly_usage_percent'] <= 100:
        raise SystemExit('weekly_usage_percent out of range')
    for field in ['measured_at', 'timezone', 'weekly_usage_percent', 'reset_at', 'plan', 'source', 'bots']:
        if field not in usage:
            raise SystemExit(f'usage record missing {field}')
    return usage


def _without_trailing_projection(text):
    """Drop a trailing projection block. Refuse to cut if finance keys follow it."""
    positions = []
    for key in PROJECTION_KEYS:
        match = re.search(rf'(?m)^ "{re.escape(key)}": ', text)
        if match:
            positions.append(match.start())
    if not positions:
        return text
    start = min(positions)
    tail_keys = TOP_LEVEL_KEY.findall(text[start:])
    if any(key not in PROJECTION_KEYS for key in tail_keys):
        raise SystemExit('refusing to rewrite metrics.json: projection keys are not trailing')
    head = text[:start].rstrip()
    if head.endswith(','):
        head = head[:-1].rstrip()
    if not head.endswith('}'):
        head += '\n}'
    if not head.endswith('\n'):
        head += '\n'
    return head


def embed_projection(text, projection):
    """Add projection keys without reserializing the finance object."""
    original = json.loads(text)
    base_text = _without_trailing_projection(text)
    base = json.loads(base_text)
    for key, value in original.items():
        if key not in PROJECTION_KEYS and base.get(key) != value:
            raise SystemExit(f'finance key drifted while stripping projection: {key}')
    stripped = base_text.rstrip()
    if not stripped.endswith('}'):
        raise SystemExit('metrics.json must end with }')
    head = stripped[:-1].rstrip()
    if head.endswith(','):
        head = head[:-1].rstrip()
    body = json.dumps({key: projection[key] for key in PROJECTION_KEYS}, ensure_ascii=False, indent=1)
    body = body.strip()[1:-1].strip('\n')
    merged = head + ',\n' + body + '\n}\n'
    parsed = json.loads(merged)
    for key, value in original.items():
        if key not in PROJECTION_KEYS and parsed.get(key) != value:
            raise SystemExit(f'finance key changed: {key}')
    for key in PROJECTION_KEYS:
        if parsed.get(key) != projection[key]:
            raise SystemExit(f'projection key not written: {key}')
    return merged


def replace_evidence(text, priority, owner, evidence):
    """Replace one evidence cell only when the caller is that row's owner."""
    priority = int(priority)
    if not 1 <= priority <= 30 or priority == 15:
        raise SystemExit('priority is outside the public company TODO')
    if not owner or not evidence or len(evidence) > 500:
        raise SystemExit('evidence must be one non-empty public cell of at most 500 characters')
    pattern = re.compile(
        r'^(\| ' + str(priority) + r' \| [^|]+? \| )([^|]+?)( \| )([^|]+?)( \|[ \t]*)$',
        re.M,
    )
    match = pattern.search(text)
    if not match:
        raise SystemExit(f'priority {priority} is missing')
    if strip_cell(match.group(2)) != owner:
        raise SystemExit('owner mismatch; refusing to write another owner row')
    updated = text[:match.start()] + f'{match.group(1)}{match.group(2)}{match.group(3)}{evidence}{match.group(5)}' + text[match.end():]
    if [r['priority'] for r in project_rows(text)] != [r['priority'] for r in project_rows(updated)]:
        raise SystemExit('row order changed')
    if [r['owner'] for r in project_rows(text)] != [r['owner'] for r in project_rows(updated)]:
        raise SystemExit('row owner changed')
    return updated


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('repository', type=Path)
    parser.add_argument('--usage-record', type=Path, required=True)
    args = parser.parse_args()
    root = args.repository.resolve()
    text = (root / 'COMPANY_TODO.md').read_text(encoding='utf-8')
    rows = project_rows(text)
    usage = load_usage(args.usage_record)
    source = projection_source(text, rows)
    projection = {'public_work': rows, 'usage_snapshot': usage, 'public_company_todo': source}
    open_dir = root / 'apps/landing/public/open'
    sidecar = open_dir / 'company-todo.json'
    sidecar.write_text(json.dumps(projection, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    metrics = open_dir / 'metrics.json'
    metrics.write_text(embed_projection(metrics.read_text(encoding='utf-8'), projection), encoding='utf-8')
    print(json.dumps({'public_work': len(rows), 'sidecar': str(sidecar), 'source': source}))


if __name__ == '__main__':
    main()
