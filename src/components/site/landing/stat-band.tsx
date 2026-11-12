"use client";

import { useEffect, useState } from "react";
import { useInView } from "@/components/site/landing/reveal";

function CountUp({ value }: { value: number }) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(value * (1 - (1 - t) ** 3));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {Math.round(display).toLocaleString("vi-VN")}
    </span>
  );
}

export function StatBand({
  stats,
}: {
  stats: { value: number | null; text?: string; label: string }[];
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="landing-aurora pointer-events-none absolute inset-0 opacity-45" aria-hidden />
        <div className="landing-grain pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative grid grid-cols-2 gap-px bg-border/70 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-surface/80 px-5 py-7 sm:px-7">
              <p className="ink-gradient text-3xl font-semibold tracking-tight sm:text-4xl">
                {stat.value === null ? stat.text : <CountUp value={stat.value} />}
              </p>
              <p className="mt-1.5 text-xs text-muted sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}