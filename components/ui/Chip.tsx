import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/schema";

const TONE_BG: Record<Tone, string> = {
  success: "bg-green-500/15 text-green-400",
  warn: "bg-yellow-500/15 text-yellow-400",
  danger: "bg-red-500/15 text-red-400",
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
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
        TONE_BG[tone],
      )}
      title={title}
    >
      {icon}
      {children}
    </span>
  );
}
