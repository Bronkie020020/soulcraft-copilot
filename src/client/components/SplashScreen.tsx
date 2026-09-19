import React, { useState, useEffect } from "react";
import { Disc, Sparkles, Zap, ArrowRight } from "lucide-react";

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState("INITIALIZING ENGINE DJ CORE...");
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(45);
      setStatusText("LOADING DENON SC LIVE 2 & AUDIO ENGINES...");
    }, 600);

    const t2 = setTimeout(() => {
      setProgress(80);
      setStatusText("SYNCING HARMONIC CAMELOT PATHS & METADATA...");
    }, 1300);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText("SOULCRAFT STUDIO SUITE v8.0 // AARDBEVING READY");
    }, 2000);

    const t4 = setTimeout(() => {
      setFading(true);
    }, 2600);

    const t5 = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#070709] flex flex-col items-center justify-center transition-opacity duration-500 overflow-hidden ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Dynamic Background Neon Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

      {/* Center Container */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center space-y-6">
        {/* Logo Badge with Dual Neon Rings */}
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-orange-500 via-amber-500 to-cyan-500 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 animate-pulse transition duration-1000"></div>

          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl bg-zinc-950 border-2 border-orange-500/50 overflow-hidden shadow-2xl shadow-orange-600/40 p-1 flex items-center justify-center">
            <img
              src="/logo.jpg"
              alt="Soulcraft Logo"
              className="w-full h-full object-cover rounded-xl transform transition-transform duration-700 hover:scale-105"
            />

            {/* Corner Badge */}
            <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md border border-orange-500/40 text-[9px] font-mono text-orange-400 px-2 py-0.5 rounded-md font-bold">
              v8.0
            </span>
          </div>
        </div>

        {/* Title & Branding */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping"></span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-orange-400 font-bold">
              Executive DJ & Release Master
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            SOULCRAFT <span className="text-orange-500 font-black">STUDIO</span>
          </h1>

          <p className="text-xs text-zinc-400 font-mono tracking-wide">
            AARDBEVING EDITION • DENON SC LIVE 2
          </p>
        </div>

        {/* Progress Bar & Status Text */}
        <div className="w-full space-y-2 pt-2">
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-[1px]">
            <div
              className="h-full bg-gradient-to-r from-orange-600 via-amber-500 to-cyan-400 rounded-full transition-all duration-300 shadow-lg shadow-orange-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <span className="text-zinc-400 truncate max-w-[280px]">{statusText}</span>
            <span className="text-orange-400 font-bold">{progress}%</span>
          </div>
        </div>

        {/* Skip button */}
        <button
          onClick={() => {
            setFading(true);
            setTimeout(onFinish, 200);
          }}
          className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition flex items-center gap-1.5 pt-2 group"
        >
          <span>Direct naar Studio</span>
          <ArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition" />
        </button>
      </div>
    </div>
  );
}
