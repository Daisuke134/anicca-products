import React from 'react';

export function FactoryActionNotice({ notice, action }) {
  if (notice?.action !== action) return null;
  return React.createElement('p', { className: 'mf-action-notice', role: 'status' }, notice.message);
}
