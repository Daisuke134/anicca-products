const blockedMessages = {
  studio_setup: 'The studio is not enabled yet.',
  runtime_setup: 'The generation worker is not configured yet.',
  provider_setup: 'The generation services are not ready yet.',
  social_setup: 'Instagram publishing is not configured yet.',
  spend_cap_setup: 'The daily generation budget guard is not ready yet.',
  company_budget_exhausted: 'The daily generation budget has been reached. It resets at 00:00 UTC.',
  billing_setup: 'Secure checkout is not configured yet.',
};

const fallbackMessages = {
  generation: 'Video generation is temporarily unavailable.',
  social: 'Instagram connection is temporarily unavailable.',
  checkout: 'Checkout is temporarily unavailable.',
};

const actionCapabilities = {
  generate_avatar: ['generation'],
  generate_video: ['generation'],
  connect_instagram: ['social', 'generation'],
  autopost: ['social', 'generation'],
  checkout: ['checkout'],
};

export function factoryQuotaState(usage) {
  const videosRemaining = usage?.videosRemaining;
  const attemptsRemaining = usage?.attemptsRemaining;
  const known = Number.isSafeInteger(videosRemaining) && Number.isSafeInteger(attemptsRemaining);
  const available = known && videosRemaining > 0 && attemptsRemaining > 0;
  return { known, available, exhausted: known && !available };
}

export function factoryCapabilityUnavailable(capability) {
  return blockedMessages[capability?.reason] || fallbackMessages[capability?.name] || 'This service is temporarily unavailable.';
}

export function requestFactoryAction(action, readiness, avatarReady, perform, notify, allowance = {}) {
  const capabilities = actionCapabilities[action] || [];
  const blocked = capabilities
    .map(name => ({ ...readiness?.[name], name }))
    .find(state => state.ready !== true);

  if (blocked) {
    notify(`${factoryCapabilityUnavailable(blocked)} No request was sent. Refresh status to check again.`);
    return false;
  }

  const allowanceRequired = ['generate_avatar', 'generate_video', 'autopost'].includes(action);
  const recoveringVideo = action === 'generate_video' && allowance.pendingVideo;
  if (allowanceRequired && !allowance.hasAccess && !recoveringVideo) {
    const message = !allowance.quotaKnown
      ? 'Your free video allowance could not be confirmed. Refresh status before starting an action.'
      : allowance.videosRemaining <= 0
        ? 'You have used your three free videos. Choose a plan to continue.'
        : allowance.attemptsRemaining <= 0
          ? 'No free generation attempts remain. Choose a plan to continue.'
          : 'A generation allowance is required to start this action.';
    notify(`${message} No request was sent.`);
    return false;
  }

  if (action === 'generate_video' && !avatarReady) {
    notify('Create your monk first. No request was sent.');
    return false;
  }

  if (action === 'connect_instagram' && !avatarReady) {
    notify('Generate your monk avatar first. No Instagram request was sent.');
    return false;
  }

  if (action === 'connect_instagram' && !allowance.completedVideoReady) {
    notify('Generate one full video first. No Instagram request was sent.');
    return false;
  }

  void perform(action);
  return true;
}
