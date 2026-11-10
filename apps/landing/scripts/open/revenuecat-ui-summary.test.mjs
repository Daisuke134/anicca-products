import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const html = await readFile(new URL('../../public/open/index.html', import.meta.url), 'utf8');

test('RevenueCat cards resolve provider summaries by their source measure name', () => {
  const match = html.match(/const rcSummary=(.*?);\s*const rcUnit=/s);
  assert.ok(match, 'Open page must define the RevenueCat summary resolver');

  const rcSummary = vm.runInNewContext(`(${match[1]})`);
  const rows = rcSummary({
    measures: [{ display_name: 'Actives' }],
    summary: {
      average: {
        Total: { Actives: 5 },
        'anicca (App Store)': { Actives: 5 },
      },
    },
  }, 'Active Subscriptions', 'average');

  assert.equal(JSON.stringify(rows), JSON.stringify([
    ['Total', 5],
    ['anicca (App Store)', 5],
  ]));
});

test('monthly cost labels accept a current-month suffix', () => {
  const match = html.match(/mlab=(m=>.*?)(?=;\s*mc\()/s);
  assert.ok(match, 'Open page must define the monthly cost label formatter');

  const monthLabel = vm.runInNewContext(match[1]);
  assert.equal(monthLabel({ month: '2026-11 (to date)' }), 'Nov');
});

test('Postiz sample metrics render with source periods and unknowns clearly labeled', () => {
  const match = html.match(/const renderPostMetrics=feed=>\{[\s\S]*?\n\};/);
  assert.ok(match, 'Open page must define the Postiz metrics renderer');
  assert.match(html, /post-metrics.*renderPostMetrics\(d\.post_metrics\)/s);

  const renderPostMetrics = vm.runInNewContext(
    `(${match[0].replace('const renderPostMetrics=', '').replace(/;$/, '')})`,
    {
      esc: (value) => String(value ?? '').replace(/[&<>\"]/g, (char) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
      })[char]),
      NN: (value) => value == null ? '—' : Number(value).toLocaleString('en-US'),
    },
  );
  const output = renderPostMetrics({
    source: 'Postiz /analytics/post',
    status: 'partial',
    observed_at: '2026-11-06T09:00:00+09:00',
    query_window: { from: '2026-10-27T00:00:00Z', to: '2026-11-05T00:00:00Z' },
    scope: 'Recent published posts only. Sample sums are not account-wide totals.',
    coverage: { sampled_posts: 2, sampled_accounts: 1 },
    platforms: [{
      platform: 'TikTok',
      sampled_posts: 2,
      published_at: { from: '2026-11-03T10:00:00Z', to: '2026-11-04T10:00:00Z' },
      observed_at: { from: '2026-11-06T08:58:00+09:00', to: '2026-11-06T08:59:00+09:00' },
      metrics: {
        views: { sample_sum: 1000, posts_with_value: 2, posts_missing_value: 0, period_from: '2026-11-03', period_to: '2026-11-04' },
        likes: { sample_sum: 12, posts_with_value: 1, posts_missing_value: 1, period_from: '2026-11-04', period_to: '2026-11-04' },
        replies: { sample_sum: null, posts_with_value: 0, posts_missing_value: 2, period_from: null, period_to: null },
        reposts: { sample_sum: 0, posts_with_value: 1, posts_missing_value: 1, period_from: '2026-11-03', period_to: '2026-11-03' },
      },
      daily: [{
        date: '2026-11-04',
        eligible_posts: 2,
        metrics: {
          views: { sample_sum: 1010, posts_with_value: 2, posts_missing_value: 0 },
          likes: { sample_sum: 12, posts_with_value: 1, posts_missing_value: 1 },
          replies: { sample_sum: null, posts_with_value: 0, posts_missing_value: 2 },
          reposts: { sample_sum: 0, posts_with_value: 1, posts_missing_value: 1 },
        },
      }],
    }],
  });

  assert.match(output, /TikTok/);
  assert.match(output, /Views · sample sum/);
  assert.match(output, /1,000/);
  assert.match(output, /2\/2 posts/);
  assert.match(output, /2026-11-03/);
  assert.match(output, /no data/);
  assert.match(output, /not account-wide totals/);
  assert.match(output, /daily sample metrics/i);
  assert.match(output, /1,010/);
  assert.doesNotMatch(output, /private account|post-1|https:\/\//);
});

test('an observed empty Postiz query is distinct from an uncollected feed', () => {
  const match = html.match(/const renderPostMetrics=feed=>\{[\s\S]*?\n\};/);
  assert.ok(match, 'Open page must define the Postiz metrics renderer');
  const renderPostMetrics = vm.runInNewContext(
    `(${match[0].replace('const renderPostMetrics=', '').replace(/;$/, '')})`,
    { esc: String, NN: (value) => value == null ? '—' : String(value) },
  );

  assert.match(renderPostMetrics({ status: 'observed_empty', platforms: [] }), /No eligible published posts/);
  assert.match(renderPostMetrics({ status: 'unavailable', platforms: [] }), /No Postiz post metrics collected/);
});
