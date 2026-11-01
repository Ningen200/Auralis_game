import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GameApp } from "@/game/GameApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-ink text-foam">
      {ready ? <GameApp /> : <BootShell />}
    </main>
  );
}

function BootShell() {
  return (
    <div className="flex h-full items-end p-4 md:items-center md:p-8">
      <div className="w-full max-w-md rounded-xl border border-line bg-panel p-4">
        <p className="font-display text-sm tracking-wide text-tide">صدى النصل</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-foam">أوراليس</h1>
        <p className="mt-3 text-sm leading-relaxed text-mist">تجهيز الجزيرة…</p>
      </div>
    </div>
  );
}
