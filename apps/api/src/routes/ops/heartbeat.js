import { Router } from 'express';
import { evaluateTriggers } from '../../services/ops/triggerEvaluator.js';
import { processReactionQueue } from '../../services/ops/reactionProcessor.js';
import { recoverStaleSteps } from '../../services/ops/staleRecovery.js';
import { promoteInsights } from '../../services/ops/insightPromoter.js';
import { processQueuedSteps } from '../../services/ops/stepWorker.js';
import { logger } from '../../lib/logger.js';

const router = Router();

/**
 * GET /api/ops/heartbeat
 * Called every 5min from VPS crontab
 *
 * 5 sequential steps:
 * 1. evaluateTriggers — evaluate events, fire matching triggers
 * 2. processReactionQueue — process Reaction Matrix chain reactions
 * 3. processQueuedSteps — execute up to 3 queued mission steps
 * 4. promoteInsights — promote high-performing hooks to WisdomPattern
 * 5. recoverStaleSteps — fail steps stuck >30min
 */
router.get('/heartbeat', async (req, res) => {
  const start = Date.now();

  try {
    const results = {
      triggers: await evaluateTriggers(4000),
      reactions: await processReactionQueue(3000),
      steps: await processQueuedSteps(3),
      insights: await promoteInsights(),
      stale: await recoverStaleSteps()
    };

    const elapsed = Date.now() - start;
    logger.info(`Heartbeat completed in ${elapsed}ms`, results);

    res.json({ ok: true, elapsed, ...results });
  } catch (error) {
    logger.error('Heartbeat failed:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
