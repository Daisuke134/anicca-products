import express from 'express';
import { z } from 'zod';
import requireInternalAuth from '../../middleware/requireInternalAuth.js';
import baseLogger from '../../utils/logger.js';
import { runMemoryCleanup } from '../../jobs/memoryCleanup.js';
import { runAutonomyCheck } from '../../jobs/autonomyCheck.js';
import { runSufferingDetectorJob } from '../../jobs/sufferingDetectorJob.js';
import { runAppNudgeSenderJob } from '../../jobs/appNudgeSenderJob.js';
import { runProactiveAppNudgeJob } from '../../jobs/proactiveAppNudgeJob.js';
import { runMoltbookShadowMonitorJob } from '../../jobs/moltbookShadowMonitorJob.js';
import { runMoltbookPosterJob } from '../../jobs/moltbookPosterJob.js';

const router = express.Router();
const logger = baseLogger.withContext('AdminJobs');

router.use(requireInternalAuth);

const sufferingFeedItemSchema = z.object({
  platform: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  externalPostId: z.string().min(1),
  platformUserId: z.string().min(1).optional(),
  context: z.string().min(1),
  severityScore: z.number().min(0).max(1).optional(),
  severity: z.string().min(1).optional(),
});

const sufferingDetectorBodySchema = z.object({
  // Optional override feed for manual E2E. Cron uses the default synthetic feed.
  feed: z.array(sufferingFeedItemSchema).min(1).max(10).optional(),
});

// POST /api/admin/jobs/memory-cleanup
router.post('/memory-cleanup', async (req, res) => {
  try {
    const result = await runMemoryCleanup();
    return res.json({ success: true, result });
  } catch (error) {
    logger.error('memory-cleanup failed', error);
    return res.status(500).json({ error: 'memory-cleanup failed' });
  }
});

// POST /api/admin/jobs/autonomy-check
router.post('/autonomy-check', async (req, res) => {
  try {
    const result = await runAutonomyCheck();
    return res.json({ success: true, result });
  } catch (error) {
    logger.error('autonomy-check failed', error);
    return res.status(500).json({ error: 'autonomy-check failed' });
  }
});

// POST /api/admin/jobs/suffering-detector (synthetic feed Day-0 verification)
router.post('/suffering-detector', async (req, res) => {
  try {
    const parsed = sufferingDetectorBodySchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid body', details: parsed.error.errors });
    }

    const result = await runSufferingDetectorJob(parsed.data.feed ? { feed: parsed.data.feed } : {});
    return res.json({ success: true, result });
  } catch (error) {
    logger.error('suffering-detector failed', error);
    return res.status(500).json({ error: 'suffering-detector failed' });
  }
});

// POST /api/admin/jobs/app-nudge-sender (alpha routing to NUDGE_ALPHA_USER_ID)
router.post('/app-nudge-sender', async (req, res) => {
  try {
    const result = await runAppNudgeSenderJob();
    return res.json({ success: true, result });
  } catch (error) {
    logger.error('app-nudge-sender failed', error);
    return res.status(500).json({ error: 'app-nudge-sender failed' });
  }
});

// POST /api/admin/jobs/proactive-app-nudge (no sensors; fixed schedule)
router.post('/proactive-app-nudge', async (req, res) => {
  try {
    const slot = req?.body?.slot;
    const result = await runProactiveAppNudgeJob(slot ? { slot } : {});
    return res.json({ success: true, result });
  } catch (error) {
    logger.error('proactive-app-nudge failed', error);
    return res.status(500).json({ error: 'proactive-app-nudge failed' });
  }
});

// POST /api/admin/jobs/moltbook-shadow-monitor (shadow mode only)
router.post('/moltbook-shadow-monitor', async (req, res) => {
  try {
    const result = await runMoltbookShadowMonitorJob();
    return res.json({ success: true, result });
  } catch (error) {
    logger.error('moltbook-shadow-monitor failed', error);
    return res.status(500).json({ error: 'moltbook-shadow-monitor failed' });
  }
});

// POST /api/admin/jobs/moltbook-poster (proactive post; no replies)
router.post('/moltbook-poster', async (req, res) => {
  try {
    const result = await runMoltbookPosterJob();
    return res.json({ success: true, result });
  } catch (error) {
    logger.error('moltbook-poster failed', error);
    return res.status(500).json({ error: 'moltbook-poster failed' });
  }
});

export default router;
