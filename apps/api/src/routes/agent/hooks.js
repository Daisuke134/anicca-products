import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

const router = Router();

/**
 * GET /api/ops/hooks (also available at /api/agent/hooks for backward compat)
 * Get all hook candidates
 */
router.get('/hooks', async (req, res) => {
  try {
    const hooks = await prisma.hookCandidate.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500
    });

    res.json({
      hooks: hooks.map(h => ({
        id: h.id,
        text: h.text,
        targetProblemTypes: h.targetProblemTypes,
        source: h.source,
        platform: h.platform,
        xSampleSize: h.xSampleSize,
        xEngagementRate: h.xEngagementRate,
        tiktokSampleSize: h.tiktokSampleSize,
        tiktokLikeRate: h.tiktokLikeRate,
        createdAt: h.createdAt
      }))
    });
  } catch (err) {
    logger.error(`GET /hooks failed: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const HookSaveSchema = z.object({
  text: z.string().min(1).max(500),
  targetProblemTypes: z.array(z.string()).min(1),
  source: z.string().max(50).default('trend-hunter'),
  platform: z.enum(['x', 'tiktok', 'both']).default('both'),
  contentType: z.enum(['empathy', 'solution']),
  idempotencyKey: z.string().max(128).optional(),
  metadata: z.record(z.unknown()).optional()
});

/**
 * POST /api/ops/hooks (also available at /api/agent/hooks for backward compat)
 * Save new hook candidate
 */
router.post('/hooks', async (req, res) => {
  try {
    const parsed = HookSaveSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { text, targetProblemTypes, source, platform, contentType, idempotencyKey, metadata } = parsed.data;

    // Idempotency key duplicate check
    if (idempotencyKey) {
      const byKey = await prisma.hookCandidate.findFirst({
        where: { idempotencyKey },
        select: { id: true, text: true, createdAt: true }
      });
      if (byKey) {
        return res.status(200).json({ status: 'duplicate', existingId: byKey.id });
      }
    }

    // Exact text duplicate check
    const existing = await prisma.hookCandidate.findFirst({
      where: { text },
      select: { id: true }
    });

    if (existing) {
      return res.status(200).json({ status: 'duplicate', existingId: existing.id });
    }

    const hook = await prisma.hookCandidate.create({
      data: {
        text,
        targetProblemTypes,
        source,
        platform,
        contentType,
        tone: contentType,
        ...(idempotencyKey ? { idempotencyKey } : {}),
        metadata: metadata || {}
      }
    });

    logger.info(`Hook candidate saved: ${hook.id} (${contentType}, ${targetProblemTypes.join(',')})`);
    res.status(201).json({ status: 'created', id: hook.id, text: hook.text, createdAt: hook.createdAt });
  } catch (err) {
    logger.error(`POST /hooks failed: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
