export type Plan = 'free' | 'plus' | 'artist' | 'pro';

export const PLAN_VALUES: Plan[] = ['free', 'plus', 'artist', 'pro'];

export const UPLOAD_LIMITS: Record<Plan, { maxTracks: number; maxSizeMB: number }> = {
  free: { maxTracks: 5, maxSizeMB: 30 },
  plus: { maxTracks: 5, maxSizeMB: 30 },
  artist: { maxTracks: 50, maxSizeMB: 100 },
  pro: { maxTracks: Number.POSITIVE_INFINITY, maxSizeMB: 200 },
};

interface PlanHolder {
  plan?: string | null;
  planExpires?: Date | string | null;
  role?: string;
}

export function effectivePlan(user?: PlanHolder | null): Plan {
  if (!user || !user.plan || user.plan === 'free') return 'free';
  if (user.planExpires && new Date(user.planExpires).getTime() < Date.now()) return 'free';
  return user.plan as Plan;
}

export function isSubscriber(user?: PlanHolder | null): boolean {
  return effectivePlan(user) !== 'free';
}
