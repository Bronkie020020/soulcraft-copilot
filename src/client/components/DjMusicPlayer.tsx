import React, { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
  Maximize2,
  X,
  Disc,
  Flag,
  Flame,
  Zap,
  Repeat
} from "lucide-react";
import { LibraryTrack } from "../../types/library.js";
import { CuePoint } from "../../types/engineDj.js";

interface DjMusicPlayerProps {
  currentTrack: LibraryTrack | null;
  onClose?: () => void;
}

export default function DjMusicPlayer({ currentTrack, onClose }: DjMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [activeCueId, setActiveCueId] = useState<string | null>(null);

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [currentTrack]);

  if (!currentTrack) return null;

  const effectiveDuration = duration || currentTrack.durationSec || 300;
  const progressPercent = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percent * effectiveDuration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }

  function jumpToCue(cue: CuePoint) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = cue.timeSec;
    setCurrentTime(cue.timeSec);
    setActiveCueId(cue.id);
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
    setTimeout(() => setActiveCueId(null), 1500);
  }

  function skipSeconds(seconds: number) {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(effectiveDuration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val > 0) setIsMuted(false);
  }

  function toggleMute() {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  }

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  const peaks = currentTrack.waveformPeaks && currentTrack.waveformPeaks.length > 0
    ? currentTrack.waveformPeaks
    : Array.from({ length: 120 }, () => 0.4);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-orange-500/30 shadow-2xl px-4 py-3 sm:px-6 flex flex-col gap-2.5 animate-in slide-in-from-bottom duration-300">
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => !isLooping && setIsPlaying(false)}
        loop={isLooping}
      />

      {/* Top Row: Track Meta & Close */}
      <div className="flex items-center justify-between gap-4">
        {/* Track Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-10 w-10 rounded-lg bg-zinc-900 border border-orange-500/40 flex items-center justify-center flex-shrink-0 shadow-md">
            <Disc className={`w-5 h-5 text-orange-400 ${isPlaying ? "animate-spin" : ""}`} />
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-zinc-950"></span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-white truncate">{currentTrack.title}</h4>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 font-bold border border-orange-500/30">
                {currentTrack.camelotKey || "8A"}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                {currentTrack.bpm || 126} BPM
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5" />
                {currentTrack.energyScore || 7}/10
              </span>
            </div>
            <p className="text-xs text-zinc-400 truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Hot Cue Direct Jump Buttons */}
        <div className="hidden lg:flex items-center gap-1.5 bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-800">
          <span className="text-[9px] font-mono uppercase text-zinc-500 font-bold px-1.5">Jump Cue:</span>
          {currentTrack.cuePoints?.map((cue) => (
            <button
              key={cue.id}
              type="button"
              onClick={() => jumpToCue(cue)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold flex items-center gap-1 transition ${
                activeCueId === cue.id
                  ? "ring-2 ring-white scale-105 shadow-md"
                  : "hover:brightness-125"
              }`}
              style={{ backgroundColor: `${cue.color}25`, color: cue.color, border: `1px solid ${cue.color}60` }}
            >
              <Flag className="w-2.5 h-2.5 fill-current" />
              {cue.name} ({cue.timestamp})
            </button>
          ))}
        </div>

        {/* Player Controls: Volume & Close */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-20 accent-orange-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>

          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-1.5 rounded-lg border text-xs transition ${
              isLooping ? "bg-orange-600/20 border-orange-500 text-orange-400" : "border-zinc-800 text-zinc-500 hover:text-white"
            }`}
            title="Loop Track"
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition"
              title="Sluit Player"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Middle: Interactive Waveform with Playhead & Cue Flags */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono text-zinc-400 w-10 text-right">{formatTime(currentTime)}</span>

        <div
          onClick={handleSeek}
          className="flex-1 h-12 bg-zinc-900/90 rounded-lg border border-zinc-800 hover:border-orange-500/50 cursor-pointer relative overflow-hidden flex items-end px-1 gap-[2px] transition group shadow-inner"
        >
          {/* Waveform Bars */}
          {peaks.map((p, idx) => {
            const barPercent = (idx / peaks.length) * 100;
            const isPlayed = barPercent <= progressPercent;
            return (
              <div
                key={idx}
                className={`flex-1 rounded-t-sm transition-all duration-75 ${
                  isPlayed
                    ? "bg-gradient-to-t from-orange-600 to-amber-400"
                    : "bg-zinc-700/60 group-hover:bg-zinc-600/80"
                }`}
                style={{ height: `${Math.max(15, p * 100)}%` }}
              />
            );
          })}

          {/* Current Playhead Scrub Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg shadow-white/50 z-20 pointer-events-none"
            style={{ left: `${progressPercent}%` }}
          >
            <span className="absolute -top-1 -left-1 h-2.5 w-2.5 rounded-full bg-white ring-2 ring-orange-500"></span>
          </div>

          {/* Hot Cue Markers on Waveform */}
          {currentTrack.cuePoints?.map((cue) => {
            const cuePercent = effectiveDuration > 0 ? (cue.timeSec / effectiveDuration) * 100 : 0;
            return (
              <div
                key={cue.id}
                className="absolute top-0 bottom-0 w-0.5 z-10 pointer-events-none"
                style={{ left: `${cuePercent}%`, backgroundColor: cue.color }}
              >
                <span
                  className="absolute top-0.5 -left-1 px-1 py-0.2 rounded text-[8px] font-mono font-bold shadow text-white pointer-events-auto cursor-pointer"
                  style={{ backgroundColor: cue.color }}
                  onClick={(e) => {
                    e.stopPropagation();
                    jumpToCue(cue);
                  }}
                  title={`${cue.name} (${cue.timestamp})`}
                >
                  {cue.name.slice(0, 4)}
                </span>
              </div>
            );
          })}
        </div>

        <span className="text-[11px] font-mono text-zinc-500 w-10">{formatTime(effectiveDuration)}</span>

        {/* Quick Transport Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => skipSeconds(-10)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition"
            title="-10s"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={togglePlay}
            className="p-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg shadow-orange-600/30 transition"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <button
            onClick={() => skipSeconds(10)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition"
            title="+10s"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
