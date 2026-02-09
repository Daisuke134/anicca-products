/**
 * Ops API auth middleware
 * Validates ANICCA_AGENT_TOKEN via Bearer auth
 * Supports token rotation with ANICCA_AGENT_TOKEN_OLD during grace period
 * (aligned with requireAgentAuth.js)
 */
export function opsAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  const currentToken = process.env.ANICCA_AGENT_TOKEN;
  const oldToken = process.env.ANICCA_AGENT_TOKEN_OLD;

  const isValid = token === currentToken || (oldToken && token === oldToken);

  if (!isValid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}
