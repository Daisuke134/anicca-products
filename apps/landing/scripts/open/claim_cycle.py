#!/usr/bin/env python3
"""One private claim, release, and expiry. Lease tokens stay out of the receipt.

A local sqlite cycle is a synthetic fixture unless a different GitHub actor
performed the request. This module does not publish claims-snapshot.json.
"""
import json
from pathlib import Path

import claim_board as board


PUBLIC_MARK = 'public/open'


def assert_private_db(path):
    resolved = Path(path).resolve()
    if PUBLIC_MARK in resolved.as_posix():
        raise SystemExit('refusing to store a lease in the public open directory')
    return resolved


def run_cycle(conn, owner, task_id='todo-26'):
    board.upsert_task(conn, task_id, 'claim writer connection', status='open', quantity_done=None)
    claimed = board.claim(conn, task_id, owner, expected_revision=0, lease_seconds=1)
    if not claimed.get('ok'):
        raise SystemExit(f'claim failed: {claimed.get("error")}')
    token = claimed['lease_token']
    revision = claimed['revision']
    stale = board.heartbeat(conn, task_id, 'other-bot', 'wrong-token', revision)
    released = board.release(conn, task_id, owner, token, revision)
    if not released.get('ok'):
        raise SystemExit(f'release failed: {released.get("error")}')
    board.expire_leases(conn)
    # A fresh short lease is expired by clock sleep in the caller when needed.
    again = board.claim(conn, task_id, owner, expected_revision=released['revision'], lease_seconds=1)
    if not again.get('ok'):
        raise SystemExit(f'reclaim failed: {again.get("error")}')
    # Force expiry without sleeping by writing an already-past lease.
    past = '2000-01-01T00:00:00Z'
    conn.execute('UPDATE tasks SET lease_expires=? WHERE task_id=?', (past, task_id))
    expired = board.expire_leases(conn)
    public = board.get_task(conn, task_id)
    public.pop('_lease_token_private', None)
    return {
        'claim': True,
        'stale_rejected': stale.get('ok') is False and stale.get('error') == 'stale_worker_rejected',
        'release': True,
        'expired_count': expired,
        'owner_after_expiry': public.get('owner'),
        'lease_state_after_expiry': public.get('lease_state'),
        'lease_token_published': False,
    }


def build_receipt(viewer, user_endpoint_status, http_claims, cycle, authenticated_request=False):
    different = authenticated_request and viewer not in {None, '', 'cursor[bot]'}
    return {
        'github_viewer': viewer,
        'github_user_endpoint_status': user_endpoint_status,
        'authenticated_request': authenticated_request,
        'different_agent_call': different,
        'synthetic_fixture': not different,
        'hosted_claim_api': False,
        'live_http': http_claims,
        'cycle': cycle,
    }


def _secret_key(value):
    if isinstance(value, dict):
        return any(key == 'lease_token' or _secret_key(item) for key, item in value.items())
    if isinstance(value, list):
        return any(_secret_key(item) for item in value)
    return False


def write_receipt(path, receipt):
    if _secret_key(receipt):
        raise SystemExit('receipt must not contain a lease token')
    Path(path).write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
