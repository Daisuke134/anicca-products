import express from 'express';
import requireAuth from '../middleware/requireAuth.js';

// The private Python service owns decisions and evidence; never use catalogue fallback.
export function managerRouter(authenticate = requireAuth) {
  const router = express.Router();
  router.use(async (req, res) => {
    const allowed = { '/health': 'GET', '/decisions': 'POST', '/observations': 'POST', '/evidence': 'DELETE', '/decision-records': 'POST' };
    if (allowed[req.path] !== req.method) return res.sendStatus(404);
    try {
      const user = await authenticate(req, res);
      if (!user) return;
      if (!Number.isFinite(user.raw?.exp) || user.raw.exp <= Date.now() / 1000) {
        return res.status(401).json({ error: 'Expired or missing token expiry' });
      }
      const base = process.env.MANAGER_PRODUCT_URL;
      const token = process.env.MANAGER_SERVICE_TOKEN;
      if (!base || !token) return res.status(503).json({ error: 'Manager unavailable' });
      const response = await fetch(new URL('/manager' + req.path, base), {
        method: req.method,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token,
          'X-Manager-Subject': String(user.sub) },
        body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
        signal: AbortSignal.timeout(35000),
        redirect: 'error',
      });
      const body = await response.json();
      return res.status(response.status).json(body);
    } catch {
      return res.status(503).json({ error: 'Manager unavailable' });
    }
  });
  return router;
}
export default managerRouter();
