#!/usr/bin/env python3
"""Record accepted output units and usage readings. Never invent a saving.

Savings stays blank until the same task has two usage readings and the same
accepted output count. A single snapshot or a synthetic claim cycle is a baseline.
"""
import argparse
import csv
import json
from pathlib import Path


FIELDS = (
    'task', 'kind', 'output_units', 'started_at', 'ended_at',
    'usage_before_percent', 'usage_before_measured_at', 'usage_before_source',
    'usage_after_percent', 'usage_after_measured_at', 'usage_after_source',
    'savings',
)


def usage_fields(record, prefix):
    if not record:
        return {f'usage_{prefix}_percent': '', f'usage_{prefix}_measured_at': '', f'usage_{prefix}_source': ''}
    return {
        f'usage_{prefix}_percent': record.get('weekly_usage_percent', ''),
        f'usage_{prefix}_measured_at': record.get('measured_at', ''),
        f'usage_{prefix}_source': record.get('source', ''),
    }


def comparable(task):
    """True only when a later run could compute savings. This file still leaves savings blank."""
    before = task.get('usage_before') or {}
    after = task.get('usage_after') or {}
    if task.get('kind') == 'synthetic_fixture' or not before or not after:
        return False
    if before.get('measured_at') == after.get('measured_at'):
        return False
    if task.get('output_units') in (None, '', 0):
        return False
    if task.get('before_output_units') != task.get('output_units'):
        return False
    try:
        float(before['weekly_usage_percent'])
        float(after['weekly_usage_percent'])
    except (KeyError, TypeError, ValueError):
        return False
    return True


def savings_for(task):
    return ''


def to_row(task):
    row = {
        'task': task['task'],
        'kind': task.get('kind', ''),
        'output_units': task.get('output_units', ''),
        'started_at': task.get('started_at', ''),
        'ended_at': task.get('ended_at', ''),
        'savings': savings_for(task),
    }
    row.update(usage_fields(task.get('usage_before'), 'before'))
    row.update(usage_fields(task.get('usage_after'), 'after'))
    return row


def write_csv(path, tasks):
    rows = [to_row(task) for task in tasks]
    with Path(path).open('w', encoding='utf-8', newline='') as handle:
        writer = csv.DictWriter(handle, FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--tasks', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    tasks = json.loads(args.tasks.read_text(encoding='utf-8'))
    rows = write_csv(args.out, tasks)
    if any(row['savings'] for row in rows):
        raise SystemExit('this baseline writer must not emit savings')
    print(json.dumps({'rows': len(rows), 'savings': 'blank'}))


if __name__ == '__main__':
    main()
