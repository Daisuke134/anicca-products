'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { _test } = require('../x402-capafy-market-report');

const PAY_TO = '0x7De1D49Ec3f71f6FF5B920AE15A67aF7410c161c';
const REPORT = {
  product: 'Capafy public agent marketplace — source-linked snapshot',
  summary: 'A short summary grounded in visible public Capafy marketplace pages.',
  findings: [{ title: 'Homepage categories', observation: 'Research and Video categories are visible.', source_url: 'https://capafy.ai/' }],
  limitations: ['Only the public homepage was inspected.'],
};

function event(method = 'GET', headers = {}) {
  return { httpMethod: method, headers, queryStringParameters: null };
}

function payment() {
  return Buffer.from(JSON.stringify({ x402Version: 2, payload: { accepted: true } })).toString('base64');
}

async function withFacilitator(run) {
  const originalFetch = global.fetch;
  const order = [];
  global.fetch = async (url, options) => {
    const path = new URL(url).pathname;
    if (path === '/verify') {
      order.push('verify');
      return Response.json({ isValid: true });
    }
    if (path === '/settle') {
      order.push('settle');
      return Response.json({ success: true, transaction: '0xtest' });
    }
    throw new Error(`unexpected fetch: ${url}`);
  };
  try {
    await run(order);
  } finally {
    global.fetch = originalFetch;
  }
}

test('x402 challenge exposes $0.15 USDC on Base to the dedicated Naive receiver', () => {
  const requirement = _test.paymentRequired().accepts[0];
  assert.equal(requirement.payTo, PAY_TO);
  assert.equal(requirement.network, 'eip155:8453');
  assert.equal(requirement.amount, '150000');
  assert.deepEqual(
    _test.paymentRequired().extensions.bazaar.schema.properties.output.properties.example.required,
    ['product', 'summary', 'findings', 'limitations', 'generated_at', 'agent_session_id', 'agent_computer_id', 'agent_browser_session_id'],
  );
  assert.equal(_test.isCapafyUrl('https://capafy.ai/agent/example/1'), true);
  assert.equal(_test.isCapafyUrl('https://capafy.ai.attacker.example/'), false);
});

test('Naive cloud agent configuration allows only the managed browser and read-only ls', () => {
  const safe = {
    skills: [],
    tools: {
      default_config: { permission: 'deny' },
      configs: {
        browser: {
          enabled: true,
          permission: 'allow',
          config: {
            allowed_domains: ['capafy.ai', '*.capafy.ai'],
            allow_writes: false,
            solve_captchas: false,
            persist_context: false,
            human_login: false,
            proxy: false,
          },
        },
        ls: { enabled: true, permission: 'allow' },
      },
    },
  };
  assert.equal(_test.hasSafeNaiveTools(safe), true);
  assert.equal(_test.hasSafeNaiveTools({
    ...safe,
    tools: { ...safe.tools, configs: { browser: safe.tools.configs.browser, read: { enabled: true, permission: 'allow' } } },
  }), false);
  assert.equal(_test.hasSafeNaiveTools({
    ...safe,
    tools: { ...safe.tools, configs: { ...safe.tools.configs, bash: { enabled: true, permission: 'allow' } } },
  }), false);
});

test('unpaid requests do not start a Naive session', async () => {
  let calls = 0;
  const handler = _test.createHandler(async () => { calls += 1; return { sessionId: 'ses_test', report: REPORT }; });
  const response = await handler(event());
  assert.equal(response.statusCode, 402);
  assert.equal(calls, 0);
});

test('valid payment runs Naive before facilitator settlement and returns the settled report', async () => {
  await withFacilitator(async (order) => {
    const handler = _test.createHandler(async ({ paymentHeader, requestId }) => {
      assert.equal(paymentHeader, payment());
      assert.equal(requestId, 'req-test');
      order.push('agent');
      return { sessionId: 'ses_test', computerId: 'cmp_test', browserSessionId: 'brw_test', report: REPORT, observedSourceUrls: ['https://capafy.ai/'] };
    });
    const response = await handler(event('GET', { 'PAYMENT-SIGNATURE': payment(), 'X-NF-Request-ID': 'req-test' }));
    assert.deepEqual(order, ['verify', 'agent', 'settle']);
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['PAYMENT-RESPONSE'] !== undefined, true);
    const body = JSON.parse(response.body);
    assert.equal(body.agent_session_id, 'ses_test');
    assert.equal(body.agent_computer_id, 'cmp_test');
    assert.equal(body.agent_browser_session_id, 'brw_test');
    assert.equal(typeof body.generated_at, 'string');
    assert.deepEqual(body.findings, REPORT.findings);
  });
});

test('agent failure returns without settling the verified payment', async () => {
  await withFacilitator(async (order) => {
    const handler = _test.createHandler(async () => { order.push('agent'); throw new Error('provider error'); });
    const response = await handler(event('GET', { 'PAYMENT-SIGNATURE': payment() }));
    assert.deepEqual(order, ['verify', 'agent']);
    assert.equal(response.statusCode, 503);
    assert.equal(JSON.parse(response.body).error, 'report_unavailable');
  });
});

test('malformed or non-Capafy source output is not settled', async () => {
  await withFacilitator(async (order) => {
    const handler = _test.createHandler(async () => {
      order.push('agent');
      return { sessionId: 'ses_test', report: { ...REPORT, findings: [{ ...REPORT.findings[0], source_url: 'https://attacker.example/' }] } };
    });
    const response = await handler(event('GET', { 'PAYMENT-SIGNATURE': payment() }));
    assert.deepEqual(order, ['verify', 'agent']);
    assert.equal(response.statusCode, 502);
  });
});

function browserTrace({
  gotoUrl = 'https://capafy.ai/',
  gotoOutput = 'https://capafy.ai/',
  citedUrl = 'https://capafy.ai/',
  includeObservation = true,
  openedId = 'brw_test',
  closedId = 'brw_test',
  computerId = '',
} = {}) {
  const events = [
    { seq: 1, type: 'tool.started', data: { name: 'browser', tool_call_id: 'goto-1', args: { action: 'goto', url: gotoUrl } } },
    { seq: 2, type: 'tool.completed', data: { name: 'browser', tool_call_id: 'goto-1', is_error: false, output: gotoOutput } },
  ];
  if (includeObservation) {
    events.push(
      { seq: 3, type: 'tool.started', data: { name: 'browser', tool_call_id: 'observe-1', args: { action: 'observe', instruction: 'Read visible page content.' } } },
      { seq: 4, type: 'tool.completed', data: { name: 'browser', tool_call_id: 'observe-1', is_error: false, output: 'Visible marketplace categories.' } },
    );
  }
  events.push(
    { seq: 5, type: 'browser.session.opened', data: { browser_session_id: openedId, computer_id: computerId } },
    { seq: 6, type: 'browser.session.closed', data: { browser_session_id: closedId } },
  );
  return { events, findings: [{ ...REPORT.findings[0], source_url: citedUrl }] };
}

test('source evidence requires a completed goto and observation of the exact cited page', () => {
  const valid = browserTrace();
  assert.equal(_test.validateBrowserEvidence(valid.events, valid.findings), true);
  assert.equal(_test.collectBrowserEvidence(valid.events).browserSessionId, 'brw_test');

  const redirectedToAnotherPage = browserTrace({ gotoOutput: 'https://capafy.ai/agent/other-listing/' });
  assert.equal(_test.validateBrowserEvidence(redirectedToAnotherPage.events, redirectedToAnotherPage.findings), false);

  const discoveredButUnvisited = browserTrace({ citedUrl: 'https://capafy.ai/agent/listing/123' });
  discoveredButUnvisited.events.splice(4, 0,
    { seq: 4, type: 'tool.started', data: { name: 'browser', tool_call_id: 'links-1', args: { action: 'links', limit: 20 } } },
    { seq: 4.5, type: 'tool.completed', data: { name: 'browser', tool_call_id: 'links-1', is_error: false, output: 'https://capafy.ai/agent/listing/123' } },
  );
  assert.equal(_test.validateBrowserEvidence(discoveredButUnvisited.events, discoveredButUnvisited.findings), false);
});

test('source evidence rejects missing observations and unmatched browser session close', () => {
  const noObservation = browserTrace({ includeObservation: false });
  assert.equal(_test.validateBrowserEvidence(noObservation.events, noObservation.findings), false);

  const wrongSessionClosed = browserTrace({ closedId: 'brw_other' });
  assert.equal(_test.validateBrowserEvidence(wrongSessionClosed.events, wrongSessionClosed.findings), false);

  const browserWithSeparateComputer = browserTrace({ computerId: 'cmp_other' });
  assert.equal(_test.validateBrowserEvidence(browserWithSeparateComputer.events, browserWithSeparateComputer.findings), true);
});

test('missing observed-source evidence is not settled even for a valid Capafy URL', async () => {
  await withFacilitator(async (order) => {
    const report = { ...REPORT, findings: [{ ...REPORT.findings[0], source_url: 'https://capafy.ai/agent/listing/123' }] };
    const handler = _test.createHandler(async () => ({
      sessionId: 'ses_test',
      computerId: 'cmp_test',
      browserSessionId: 'brw_test',
      report,
      observedSourceUrls: ['https://capafy.ai/'],
    }));
    const response = await handler(event('GET', { 'PAYMENT-SIGNATURE': payment() }));
    assert.deepEqual(order, ['verify']);
    assert.equal(response.statusCode, 502);
  });
});

test('missing session Computer evidence is not settled', async () => {
  await withFacilitator(async (order) => {
    const handler = _test.createHandler(async () => {
      order.push('agent');
      return {
        sessionId: 'ses_test',
        report: REPORT,
        observedSourceUrls: ['https://capafy.ai/'],
      };
    });
    const response = await handler(event('GET', { 'PAYMENT-SIGNATURE': payment() }));
    assert.deepEqual(order, ['verify', 'agent']);
    assert.equal(response.statusCode, 502);
  });
});

test('missing browser session evidence is not settled', async () => {
  await withFacilitator(async (order) => {
    const handler = _test.createHandler(async () => ({
      sessionId: 'ses_test',
      computerId: 'cmp_test',
      report: REPORT,
      observedSourceUrls: ['https://capafy.ai/'],
    }));
    const response = await handler(event('GET', { 'PAYMENT-SIGNATURE': payment() }));
    assert.deepEqual(order, ['verify']);
    assert.equal(response.statusCode, 502);
  });
});

test('Naive spend must be a finite nonnegative amount within the session budget', () => {
  for (const value of [undefined, NaN, Infinity, -1, 100_001]) {
    assert.equal(_test.isValidConsumedCost(value, 100_000), false);
  }
  assert.equal(_test.isValidConsumedCost(0, 100_000), true);
  assert.equal(_test.isValidConsumedCost(100_000, 100_000), true);
});

test('HEAD requests do not invoke the paid agent workflow', async () => {
  let calls = 0;
  const handler = _test.createHandler(async () => { calls += 1; return { sessionId: 'ses_test', report: REPORT }; });
  const response = await handler(event('HEAD'));
  assert.equal(response.statusCode, 405);
  assert.equal(calls, 0);
});
