import { prisma } from '../../../lib/prisma.js';
import { logger } from '../../../lib/logger.js';

/**
 * TikTok投稿
 *
 * Input: { content: string, hookId: string, verificationScore: number }
 * Output: { postId: string }
 * Events: tiktok_posted
 */
export async function executePostTiktok({ input, missionId }) {
  const { content, hookId, verificationScore } = input;

  if (!content) {
    throw new Error('post_tiktok requires input.content');
  }

  const tiktokPost = await prisma.tiktokPost.create({
    data: {
      caption: content,
      hookCandidateId: hookId || null,
      slot: input.slot || null,
      postedAt: new Date(),
      agentReasoning: JSON.stringify({ verificationScore, missionId })
    }
  });

  logger.info(`TikTok post recorded: ${tiktokPost.id}`);

  return {
    output: {
      postId: tiktokPost.id,
      platform: 'tiktok'
    },
    events: [{
      kind: 'tiktok_posted',
      tags: ['tiktok', 'posted'],
      payload: {
        postId: tiktokPost.id,
        hookId,
        contentPreview: content.substring(0, 50)
      }
    }]
  };
}
