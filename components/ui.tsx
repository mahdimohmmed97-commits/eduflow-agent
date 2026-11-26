"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SubmissionStatus } from "@/lib/types";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal";

export const buttonClass = {
  primary: `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-2 disabled:cursor-not-allowed disabled:opacity-50 ${focus}`,
  secondary: `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink ring-1 ring-line transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-50 ${focus}`,
  ghost: `inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 ${focus}`,
  danger: `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50 ${focus}`,
};

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonClass }) {
  return <button type={type} className={cn(buttonClass[variant], className)} {...props} />;
}

export const inputClass = `w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-teal/30 placeholder:text-muted/70 focus:border-teal focus:ring-2 ${focus}`;

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function PageIntro({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow ? <p className="mb-1 text-sm font-semibold text-gold-2">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
      </div>
      {action}
    </div>
  );
}

export const statusTone: Record<SubmissionStatus, string> = {
  submitted: "bg-emerald-50 text-emerald-950 ring-emerald-200",
  late: "bg-amber-50 text-amber-950 ring-amber-200",
  not_submitted: "bg-rose-50 text-rose-950 ring-rose-200",
};

export function StatusBadge({ status, label }: { status: SubmissionStatus; label: string }) {
  return (
    <span className={cn("inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1", statusTone[status])}>
      {label}
    </span>
  );
}

export function SplitBar({ submitted, late, missing }: { submitted: number; late: number; missing: number }) {
  const total = submitted + late + missing;
  if (total === 0) return <div className="h-2.5 rounded-full bg-line" />;
  return (
    <div className="flex h-2.5 overflow-hidden rounded-full bg-line" dir="ltr" aria-hidden>
      <span className="bg-emerald-600" style={{ width: `${(submitted / total) * 100}%` }} />
      <span className="bg-amber-500" style={{ width: `${(late / total) * 100}%` }} />
      <span className="bg-rose-500" style={{ width: `${(missing / total) * 100}%` }} />
    </div>
  );
}

export function Modal({
  open,
  title,
  closeLabel,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const previously = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = panel?.querySelectorAll<HTMLElement>("button, [href], input, select, textarea");
    focusable?.[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>("button, [href], input, select, textarea")].filter(
        (item) => !item.hasAttribute("disabled"),
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      previously?.focus();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 cursor-pointer bg-navy/55" aria-label={closeLabel} onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-paper p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-semibold text-ink">
            {title}
          </h2>
          <button type="button" className={buttonClass.ghost} onClick={onClose}>
            {closeLabel}
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Fall through to the selection copy below.
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.insetInlineStart = "-9999px";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  } catch {
    // The button still confirms so a blocked clipboard does not look broken.
  }
}

export function CopyButton({
  text,
  label,
  copiedLabel,
  className,
  onCopied,
}: {
  text: string;
  label: string;
  copiedLabel: string;
  className?: string;
  onCopied?: () => void;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-live="polite"
      className={cn(done ? buttonClass.primary : buttonClass.secondary, "min-w-28 px-3 py-2", className)}
      onClick={() => {
        setDone(true);
        window.setTimeout(() => setDone(false), 12000);
        void copyText(text);
        window.setTimeout(() => onCopied?.(), 0);
      }}
    >
      {done ? copiedLabel : label}
    </button>
  );
}
