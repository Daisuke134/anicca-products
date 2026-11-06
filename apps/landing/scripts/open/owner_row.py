#!/usr/bin/env python3
"""Change one company TODO evidence cell for a mapped GitHub actor.

Verification-only actors get a pull request and cannot push main.
Unmapped actors, including Muse, Dots, and Codex until the owner adds
their existing GitHub logins, are refused. This does not grant new access.
"""
import argparse
import json
from pathlib import Path

import write_company_todos as writer


def load_actors(path):
    data = json.loads(Path(path).read_text(encoding='utf-8'))
    if 'actors' not in data:
        raise SystemExit('row actor map is missing actors')
    return data


def authorize(actor_map, actor, owner):
    record = actor_map.get('actors', {}).get(actor)
    if not record:
        reason = actor_map.get('unmapped_reason', {}).get(actor, 'actor is not mapped')
        raise SystemExit(f'refusing unmapped actor: {reason}')
    if owner not in record.get('owners', []):
        raise SystemExit('refusing to write a row owned by someone else')
    if record.get('verification_only'):
        return 'pull_request'
    raise SystemExit('only verification-only pull requests are implemented')


def apply_owner_evidence(text, actor_map, actor, priority, evidence):
    rows = writer.project_rows(text)
    match = next((row for row in rows if row['priority'] == int(priority)), None)
    if match is None:
        raise SystemExit('priority is not a public row')
    mode = authorize(actor_map, actor, match['owner'])
    updated = writer.replace_evidence(text, priority, match['owner'], evidence)
    return {'mode': mode, 'owner': match['owner'], 'actor': actor, 'priority': int(priority), 'text': updated}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--actors', type=Path, required=True)
    parser.add_argument('--todo', type=Path, required=True)
    parser.add_argument('--actor', required=True)
    parser.add_argument('--priority', type=int, required=True)
    parser.add_argument('--evidence', required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    result = apply_owner_evidence(
        args.todo.read_text(encoding='utf-8'),
        load_actors(args.actors),
        args.actor,
        args.priority,
        args.evidence,
    )
    if result['mode'] != 'pull_request':
        raise SystemExit('refusing a direct write')
    args.out.write_text(result['text'], encoding='utf-8')
    print(json.dumps({key: result[key] for key in ('mode', 'owner', 'actor', 'priority')}))


if __name__ == '__main__':
    main()
