export type StalenessLevel = "fresh" | "warn" | "stale" | "unknown";

export interface StalenessResult {
  level: StalenessLevel;
  age_seconds: number | null;
}

export interface ComputeStalenessInput {
  generated_at: string | null;
  now?: Date;
  warnSeconds: number;
  staleSeconds: number;
}

export function computeStaleness({
  generated_at,
  now = new Date(),
  warnSeconds,
  staleSeconds,
}: ComputeStalenessInput): StalenessResult {
  if (!generated_at) return { level: "unknown", age_seconds: null };
  const generated = new Date(generated_at).getTime();
  if (Number.isNaN(generated)) return { level: "unknown", age_seconds: null };
  const ageMs = now.getTime() - generated;
  const ageSeconds = Math.max(0, Math.round(ageMs / 1000));
  if (ageSeconds >= staleSeconds) return { level: "stale", age_seconds: ageSeconds };
  if (ageSeconds >= warnSeconds) return { level: "warn", age_seconds: ageSeconds };
  return { level: "fresh", age_seconds: ageSeconds };
}
