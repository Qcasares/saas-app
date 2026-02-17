"use client";

import { Suspense } from "react";
import RegisterContent from "./RegisterContent";

function GlowingOrb({
  color,
  size = 300,
  top,
  left,
  right,
  bottom,
  delay = 0,
}: {
  color: string;
  size?: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  delay?: number;
}) {
  const position = {
    ...(top && { top }),
    ...(left && { left }),
    ...(right && { right }),
    ...(bottom && { bottom }),
  };

  return (
    <div
      className="absolute rounded-full animate-pulse-glow pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: "blur(60px)",
        opacity: 0.4,
        animationDelay: `${delay}s`,
        ...position,
      }}
    />
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <GlowingOrb color="#ff00ff" size={400} top="-10%" right="-10%" delay={0} />
        <GlowingOrb color="#00ffff" size={500} bottom="-10%" left="-10%" delay={2} />
      </div>
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-fuchsia-500/30 border-t-fuchsia-500 animate-spin"></div>
        <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 blur-xl opacity-30 animate-pulse"></div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RegisterContent />
    </Suspense>
  );
}
