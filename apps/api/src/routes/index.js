import express from 'express';
import rateLimit from 'express-rate-limit';

// Mobile
import mobileRouter from './mobile/index.js';

// Auth
import appleAuthRouter from './auth/apple.js';
import refreshAuthRouter from './auth/refresh.js';

// Billing
import billingRouter from './billing/index.js';

// Admin (internal API for TikTok agent / GitHub Actions)
import adminTiktokRouter from './admin/tiktok.js';
import adminHookCandidatesRouter from './admin/hookCandidates.js';
import adminXPostsRouter from './admin/xposts.js';
import adminTriggerNudgesRouter from './admin/triggerNudges.js';
import adminOpsEventsRouter from './admin/opsEvents.js';
import adminRoundtableRouter from './admin/roundtable.js';
import adminResearchRouter from './admin/research.js';
import adminJobsRouter from './admin/jobs.js';

// 1.6.1: Agent API (OpenClaw/VPS)
import agentRouter from './agent/index.js';

const router = express.Router();

router.use('/mobile', mobileRouter);

router.use('/auth/apple', appleAuthRouter);
router.use('/auth/refresh', refreshAuthRouter);

router.use('/billing', billingRouter);

// Admin API (requireInternalAuth on each router + rate limit 30 req/min)
const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
router.use('/admin/tiktok', adminLimiter, adminTiktokRouter);
router.use('/admin/hook-candidates', adminLimiter, adminHookCandidatesRouter);
router.use('/admin/x', adminLimiter, adminXPostsRouter);
router.use('/admin/trigger-nudges', adminLimiter, adminTriggerNudgesRouter);
router.use('/admin/ops', adminLimiter, adminOpsEventsRouter);
router.use('/admin/roundtable', adminLimiter, adminRoundtableRouter);
router.use('/admin/research', adminLimiter, adminResearchRouter);
router.use('/admin/jobs', adminLimiter, adminJobsRouter);

// 1.6.1: Agent API (60 req/min rate limit)
const agentLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
router.use('/agent', agentLimiter, agentRouter);

export default router;
