import React from "react";
import { createRoot } from "react-dom/client";
import { GameApp } from "@/game/GameApp";
import "./styles.css";

function WebGame() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-ink text-foam">
      <GameApp />
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Auralis root element was not found.");
createRoot(root).render(
  <React.StrictMode>
    <WebGame />
  </React.StrictMode>,
);
