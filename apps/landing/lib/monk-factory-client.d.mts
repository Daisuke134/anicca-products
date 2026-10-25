export type FactoryAction = 'checkout' | 'portal' | 'generate_avatar' | 'generate_video' | 'connect_instagram' | 'autopost' | 'pause' | 'resume' | 'stop';
export class FactoryClientError extends Error { code: string; }
export function factoryRequest(token: string, action?: FactoryAction, options?: { idempotencyKey?: string; signal?: AbortSignal; fetchImpl?: typeof fetch }): Promise<Record<string, unknown>>;
export function factoryDestination(result: Record<string, unknown>, action: 'checkout' | 'portal' | 'connect_instagram'): string | null;
