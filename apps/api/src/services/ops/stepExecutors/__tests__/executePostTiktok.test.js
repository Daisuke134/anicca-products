import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../../../../test/setup.js';

describe('executePostTiktok', () => {
  // T45: test_executePostTiktok_createsTiktokPost
  it('T45: creates TiktokPost record and emits tiktok_posted event', async () => {
    prismaMock.tiktokPost.create.mockResolvedValue({
      id: 'tiktok-1',
      caption: 'test tiktok post',
      hookCandidateId: 'hook-1'
    });

    const { executePostTiktok } = await import('../executePostTiktok.js');
    const result = await executePostTiktok({
      input: { content: 'test tiktok post', hookId: 'hook-1', verificationScore: 4 },
      missionId: 'mission-1'
    });

    expect(result.output.postId).toBe('tiktok-1');
    expect(result.output.platform).toBe('tiktok');
    expect(result.events).toHaveLength(1);
    expect(result.events[0].kind).toBe('tiktok_posted');
  });

  it('throws when content is missing', async () => {
    const { executePostTiktok } = await import('../executePostTiktok.js');

    await expect(executePostTiktok({
      input: {},
      missionId: 'mission-1'
    })).rejects.toThrow('post_tiktok requires input.content');
  });
});
