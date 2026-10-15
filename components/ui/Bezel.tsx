import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/**
 * A card set in a tray: a faint outer shell with a hairline, and the content core inside it with a
 * concentric, slightly smaller radius. Every major card on the site uses it.
 */
export function Bezel({
  children,
  className = "",
  coreClassName = "",
  tone = "white",
}: {
  children: React.ReactNode;
  className?: string;
  coreClassName?: string;
  /** white core on light grounds, pine core for the dark accent card, teal for the action card */
  tone?: "white" | "pine" | "teal" | "mist";
}) {
  const core =
    tone === "pine"
      ? "bg-pine-900 text-chalk shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
      : tone === "teal"
      ? "bg-teal-400 text-pine-950 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45)]"
      : tone === "mist"
      ? "bg-pine-50 text-pine-900 shadow-inner"
      : "bg-white text-pine-900 shadow-inner";
  return (
    <div className={`rounded-[2rem] bg-pine-900/[0.035] p-1.5 ring-1 ring-pine-900/[0.06] ${className}`}>
      <div className={`h-full rounded-[calc(2rem-0.375rem)] shadow-soft ${core} ${coreClassName}`}>{children}</div>
    </div>
  );
}

const pill =
  "group inline-flex min-h-[52px] items-center gap-3 rounded-full py-1.5 pl-6 pr-1.5 text-[15px] font-bold transition-[transform,background-color] duration-500 ease-spring active:scale-[0.98]";

const tones = {
  pine: { btn: "bg-pine-900 text-chalk hover:bg-pine-800", dot: "bg-white/10" },
  teal: { btn: "bg-teal-400 text-pine-950 hover:bg-teal-300", dot: "bg-pine-950/10" },
  white: { btn: "bg-white text-pine-900 shadow-soft hover:bg-pine-50", dot: "bg-pine-900/[0.06]" },
};

/** The trailing icon sits in its own circle, flush with the button's right edge. */
function Trail({ icon, dot }: { icon?: React.ReactNode; dot: string }) {
  return (
    <span
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-500 ease-spring group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105 ${dot}`}
    >
      {icon ?? <ArrowUpRight className="h-[18px] w-[18px]" strokeWidth={1.75} />}
    </span>
  );
}

type PillProps = {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  icon?: React.ReactNode;
  className?: string;
};

export function PillLink({ href, external, ...p }: PillProps & { href: string; external?: boolean }) {
  const t = tones[p.tone ?? "pine"];
  const cls = `${pill} ${t.btn} ${p.className ?? ""}`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="sponsored noopener noreferrer" className={cls}>
        {p.children}
        <Trail icon={p.icon} dot={t.dot} />
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {p.children}
      <Trail icon={p.icon} dot={t.dot} />
    </Link>
  );
}

export function PillButton({
  onClick,
  type = "button",
  disabled,
  ...p
}: PillProps & { onClick?: () => void; type?: "button" | "submit"; disabled?: boolean }) {
  const t = tones[p.tone ?? "pine"];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${pill} ${t.btn} disabled:opacity-60 ${p.className ?? ""}`}>
      {p.children}
      <Trail icon={p.icon} dot={t.dot} />
    </button>
  );
}
