import { prisma } from '../../../lib/prisma.js';
import { logger } from '../../../lib/logger.js';

/**
 * 投稿のエンゲージメントデータ取得
 *
 * Input: { triggeredBy: string, eventId: string }
 * Output: { metrics: Object, postId: string, platform: string }
 */
export async function executeFetchMetrics({ input, proposalPayload }) {
  const event = await prisma.opsEvent.findUnique({
    where: { id: input.eventId || proposalPayload.eventId }
  });

  if (!event) {
    throw new Error(`Event not found: ${input.eventId}`);
  }

  const postId = event.payload?.postId;
  const platform = event.kind.includes('tweet') ? 'x' : 'tiktok';

  let metrics;
  if (platform === 'x') {
    const post = await prisma.xPost.findUnique({ where: { id: postId } });
    const impressions = Number(post?.impressionCount || 0n);
    const likes = Number(post?.likeCount || 0n);
    const retweets = Number(post?.retweetCount || 0n);
    const replies = Number(post?.replyCount || 0n);
    const engagements = likes + retweets + replies;
    metrics = {
      impressions,
      engagements,
      likes, retweets, replies,
      engagementRate: impressions > 0
        ? (engagements / impressions * 100).toFixed(2)
        : Number(post?.engagementRate || 0).toFixed(2)
    };
  } else {
    const post = await prisma.tiktokPost.findUnique({ where: { id: postId } });
    const views = Number(post?.viewCount || 0n);
    const likes = Number(post?.likeCount || 0n);
    const comments = Number(post?.commentCount || 0n);
    const shares = Number(post?.shareCount || 0n);
    metrics = {
      views,
      likes, comments, shares,
      engagementRate: views > 0
        ? (likes / views * 100).toFixed(2)
        : '0'
    };
  }

  logger.info(`Metrics fetched for ${platform} post ${postId}: ${JSON.stringify(metrics)}`);

  return {
    output: { metrics, postId, platform },
    events: [{
      kind: `${platform}_metrics_fetched`,
      tags: [platform, 'metrics', 'fetched'],
      payload: { postId, ...metrics }
    }]
  };
}
