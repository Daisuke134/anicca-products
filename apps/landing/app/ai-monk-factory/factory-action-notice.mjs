import React from 'react';

export function FactoryActionNotice({ notice, action, blockedMessage }) {
  const message = notice?.action === action ? notice.message : blockedMessage;
  if (!message) return null;
  return React.createElement('p', { className: 'mf-action-notice', role: 'status' }, message);
}
