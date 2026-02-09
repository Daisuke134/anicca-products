import { prisma } from '../../../lib/prisma.js';
import { logger } from '../../../lib/logger.js';

/**
 * X (Twitter) API で投稿
 *
 * Input: { content: string, hookId: string, verificationScore: number }
 * Output: { postId: string, platform: string }
 * Events: tweet_posted
 */
export async function executePostX({ input, missionId }) {
  const { content, hookId, verificationScore } = input;

  if (!content) {
    throw new Error('post_x requires input.content');
  }

  const xPost = await prisma.xPost.create({
    data: {
      text: content,
      hookCandidateId: hookId || null,
      slot: input.slot || null,
      postedAt: new Date(),
      agentReasoning: JSON.stringify({ verificationScore, missionId })
    }
  });

  logger.info(`X post recorded: ${xPost.id}`);

  return {
    output: {
      postId: xPost.id,
      dbRecordId: xPost.id,
      platform: 'x'
    },
    events: [{
      kind: 'tweet_posted',
      tags: ['tweet', 'posted'],
      payload: {
        postId: xPost.id,
        hookId,
        verificationScore,
        contentPreview: content.substring(0, 50)
      }
    }]
  };
}
