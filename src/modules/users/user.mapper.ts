import { UserEntity } from './entities/user.entity';

export interface ClimberSummary {
  id: string;
  name: string;
  handle: string | null;
  avatarColor: string | null;
  initials: string | null;
  topGrade: string | null;
  pictureUrl: string | null;
}

const FALLBACK_COLORS = [
  '#FF6B3D',
  '#FF3D77',
  '#38E1D6',
  '#8B5CF6',
  '#3DDC97',
  '#F2C94C',
];

/** Deterministic avatar color from a seed string (used when none is set). */
export const colorForSeed = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
};

/** Derive up-to-two-letter initials from a display name. */
export const initialsForName = (name?: string | null): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/** Compact climber shape reused across feed / explore / route responses. */
export const toClimberSummary = (user: UserEntity): ClimberSummary => ({
  id: user.id,
  name: user.name ?? user.handle ?? 'Climber',
  handle: user.handle ?? null,
  avatarColor: user.avatarColor ?? colorForSeed(user.id),
  initials: user.initials ?? initialsForName(user.name),
  topGrade: user.topGrade ?? null,
  pictureUrl: user.pictureUrl ?? null,
});
