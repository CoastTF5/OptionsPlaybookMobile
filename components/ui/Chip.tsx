import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/schema";

const TONE_BG: Record<Tone, string> = {
  success: "bg-tone-success-dim text-tone-success",
  warn: "bg-tone-warn-dim text-tone-warn",
  danger: "bg-tone-danger-dim text-tone-danger",
  muted: "bg-white/[0.06] text-tertiary",
};

export function Chip({
  children,
  tone = "muted",
  icon,
  title,
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  title?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider whitespace-nowrap",
        TONE_BG[tone],
      )}
      title={title}
    >
      {icon}
      {children}
    </span>
  );
}
