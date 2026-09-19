import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Music,
  Image as ImageIcon,
  Copy,
  Check,
  Disc,
  Clock,
  Tag,
  Radio,
  Share2,
  Play,
  Pause,
  Sliders,
  ExternalLink,
  Layers,
  Terminal,
  Trash2,
  Volume2,
  RefreshCw,
  Send
} from "lucide-react";

interface ArtworkPrompt {
  id: string;
  styleName: string;
  promptText: string;
  aspectRatio: string;
  negativePrompt?: string;
  generatedImageUrl?: string;
}

interface EngineTrackItem {
  index: number;
  artist: string;
  title: string;
  timestamp?: string;
  durationSeconds?: number;
  bpm?: number;
  key?: string;
}

interface SoundcloudRelease {
  id: string;
  createdAt: string;
  titleSuggestions: string[];
  selectedTitle: string;
  primaryGenre: string;
  subGenres: string[];
  tags: string[];
  description: string;
  tracklistFormatted: string;
  parsedTracks?: EngineTrackItem[];
  artworkPrompts: ArtworkPrompt[];
  releaseStrategyTips: string[];
  socialKit?: {
    instagramCaption: string;
    tiktokHooks: string[];
    repostOutreach: string;
  };
  status: string;
}

export default function App() {
  const [releases, setReleases] = useState<SoundcloudRelease[]>([]);
  const [activeRelease, setActiveRelease] = useState<SoundcloudRelease | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [renderingArtwork, setRenderingArtwork] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPlayingSim, setIsPlayingSim] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(32); // percentage for waveform scrubber
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [vibe, setVibe] = useState("Diepe, strakke Chicago House met rauwe jackin drums en analoge 909 percussie.");
  const [bpmRange, setBpmRange] = useState("125 - 127 BPM");
  const [rawTracklist, setRawTracklist] = useState(
    "Dennis Quin - Chant Groove\nKerri Chandler - Atmosphere (Jerome Sydenham Remix)\nSoulcraft - Midnight Jack (Original Mix)\nFloorplan - Never Grow Old\nCatz 'n Dogz - Jack (Club Tool)"
  );

  useEffect(() => {
    fetchReleases();
  }, []);

  // Waveform playback simulation timer
  useEffect(() => {
    let interval: any;
    if (isPlayingSim) {
      interval = setInterval(() => {
        setPlaybackProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlayingSim]);

  async function fetchReleases() {
    try {
      const res = await fetch("/api/releases");
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setReleases(json.data);
        if (!activeRelease) setActiveRelease(json.data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/releases/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vibeDescription: vibe, bpmRange, rawTracklist })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setReleases([json.data, ...releases.filter((r) => r.id !== json.data.id)]);
        setActiveRelease(json.data);
      } else {
        setErrorMsg(json.error || "Er is een fout opgetreden bij het genereren.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Netwerkfout bij verbinden met Fastify API.");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickParse() {
    if (!rawTracklist.trim()) return;
    setParsing(true);
    try {
      const res = await fetch("/api/tools/parse-tracklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: rawTracklist, avgDuration: 4.5 })
      });
      const json = await res.json();
      if (json.success && json.data?.formattedString) {
        setRawTracklist(json.data.formattedString);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setParsing(false);
    }
  }

  async function handleRenderArtwork(promptItem: ArtworkPrompt) {
    if (!activeRelease) return;
    setRenderingArtwork(promptItem.id);
    try {
      const res = await fetch(`/api/releases/${activeRelease.id}/artwork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId: promptItem.id, promptText: promptItem.promptText })
      });
      const json = await res.json();
      if (json.success && json.release) {
        setActiveRelease(json.release);
        setReleases((prev) => prev.map((r) => (r.id === json.release.id ? json.release : r)));
      }
    } catch (e) {
      console.error("Artwork error:", e);
    } finally {
      setRenderingArtwork(null);
    }
  }

  async function handleDeleteRelease(id: string) {
    if (!confirm("Weet je zeker dat je deze release wilt verwijderen?")) return;
    try {
      await fetch(`/api/releases/${id}`, { method: "DELETE" });
      const updated = releases.filter((r) => r.id !== id);
      setReleases(updated);
      if (activeRelease?.id === id) {
        setActiveRelease(updated[0] || null);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  const activeArtworkUrl =
    activeRelease?.artworkPrompts.find((p) => p.generatedImageUrl)?.generatedImageUrl ||
    "/artwork/fallback.svg";

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      {/* Studio Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-600/30">
            <Disc className={`w-5 h-5 text-white ${isPlayingSim ? "animate-spin-slow" : ""}`} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              SOULCRAFT <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 font-mono border border-orange-500/20">STUDIO SUITE v3.0</span>
            </h1>
            <p className="text-xs text-zinc-400">Denon SC Live 2 Engine & SoundCloud Master</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            FASTIFY & ENGINE READY
          </span>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Input Form & Mix History */}
        <aside className="w-full lg:w-[400px] border-r border-zinc-800/80 bg-zinc-950/40 p-5 flex flex-col gap-6 overflow-y-auto">
          <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-400" />
                Engine DJ Set Invoer
              </span>
              <span className="text-[10px] font-mono text-zinc-500">SC LIVE 2</span>
            </h2>

            {errorMsg && (
              <div className="mb-3 p-2.5 bg-red-950/50 border border-red-800/60 rounded-lg text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1">Set Thema / Sfeer</label>
                <textarea
                  rows={2}
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1">BPM Range</label>
                <input
                  type="text"
                  value={bpmRange}
                  onChange={(e) => setBpmRange(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-zinc-400">Denon Playlist / History Export</label>
                  <button
                    type="button"
                    onClick={handleQuickParse}
                    disabled={parsing}
                    className="text-[10px] text-orange-400 hover:text-orange-300 font-mono flex items-center gap-1"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${parsing ? "animate-spin" : ""}`} />
                    Bereken Timestamps
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={rawTracklist}
                  onChange={(e) => setRawTracklist(e.target.value)}
                  placeholder="Plak hier je tracks of M3U playlist export..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-orange-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 disabled:opacity-50 transition transform active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-amber-200" />
                    Set Verwerken via Copilot...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Compileer Release Kit (v3.0)
                  </>
                )}
              </button>
            </form>
          </div>

          {/* History */}
          <div className="flex-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center justify-between">
              <span>Releases Archief</span>
              <span className="font-mono text-[10px]">{releases.length} opgeslagen</span>
            </h3>
            <div className="space-y-1.5 overflow-y-auto max-h-[380px] pr-1">
              {releases.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-600">
                  Nog geen opgeslagen sets. Compileer een nieuwe release hierboven!
                </div>
              ) : (
                releases.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => setActiveRelease(rel)}
                    className={`w-full cursor-pointer text-left p-3 rounded-lg border transition group flex items-start justify-between ${
                      activeRelease?.id === rel.id
                        ? "bg-zinc-800/90 border-orange-500/60 shadow-md"
                        : "bg-zinc-900/30 border-zinc-800/40 hover:bg-zinc-900"
                    }`}
                  >
                    <div className="flex-1 pr-2 min-w-0">
                      <div className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white">
                        {rel.selectedTitle}
                      </div>
                      <div className="text-[10px] text-zinc-500 flex items-center justify-between mt-1 font-mono">
                        <span className="text-orange-400/80">{rel.primaryGenre}</span>
                        <span>{new Date(rel.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRelease(rel.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition"
                      title="Verwijder set"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Right Stage */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
          {activeRelease ? (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* LIVE SOUNDCLOUD PLAYER SIMULATION */}
              <div className="bg-[#121214] border border-zinc-800/90 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
                  <div className="flex items-center gap-5 w-full md:w-auto">
                    <button
                      onClick={() => setIsPlayingSim(!isPlayingSim)}
                      className="w-16 h-16 rounded-full bg-[#f50] hover:bg-[#ff5500] text-white flex items-center justify-center shadow-lg shadow-orange-500/30 transition transform hover:scale-105 active:scale-95 flex-shrink-0"
                    >
                      {isPlayingSim ? (
                        <Pause className="w-7 h-7 fill-current" />
                      ) : (
                        <Play className="w-7 h-7 fill-current ml-1" />
                      )}
                    </button>
                    <div>
                      <span className="text-[11px] font-mono text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full inline-block">
                        SoundCloud Player Simulation
                      </span>
                      <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mt-1.5">
                        {activeRelease.selectedTitle}
                      </h2>
                      <p className="text-xs text-zinc-400 font-mono mt-1">
                        Soulcraft • {activeRelease.primaryGenre} • {activeRelease.subGenres.join(" / ")}
                      </p>
                    </div>
                  </div>

                  {/* Artwork Thumbnail in Player */}
                  <div className="w-28 h-28 rounded-xl bg-zinc-900 border border-zinc-700/80 overflow-hidden flex-shrink-0 relative group shadow-lg">
                    <img
                      src={activeArtworkUrl}
                      alt="Cover"
                      className="w-full h-full object-cover transition transform group-hover:scale-105 duration-300"
                    />
                    <a
                      href={activeArtworkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/80 px-1.5 py-0.5 rounded text-zinc-300">
                      1:1 HQ
                    </span>
                  </div>
                </div>

                {/* Simulated Audio Waveform with interactive scrubber */}
                <div className="mt-6 space-y-1.5 relative z-10">
                  <div
                    className="h-14 w-full flex items-end gap-[2px] cursor-pointer group py-1"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      setPlaybackProgress((x / rect.width) * 100);
                    }}
                  >
                    {Array.from({ length: 96 }).map((_, i) => {
                      // Generate dynamic waveform bars
                      const height = Math.min(
                        100,
                        Math.max(
                          18,
                          Math.sin(i * 0.28) * 38 +
                            Math.cos(i * 0.7) * 30 +
                            Math.sin(i * 1.5) * 15 +
                            52
                        )
                      );
                      const barPercent = (i / 96) * 100;
                      const isPast = barPercent <= playbackProgress;
                      return (
                        <div
                          key={i}
                          style={{ height: `${height}%` }}
                          className={`flex-1 rounded-[1px] transition-all duration-75 ${
                            isPast
                              ? "bg-[#f50]"
                              : "bg-zinc-700 hover:bg-zinc-400 group-hover:opacity-90"
                          }`}
                        />
                      );
                    })}
                  </div>

                  <div className="flex justify-between text-[11px] font-mono text-zinc-500 pt-1">
                    <span className="text-orange-400">
                      {String(Math.floor((playbackProgress * 36) / 60)).padStart(2, "0")}:
                      {String(Math.floor((playbackProgress * 36) % 60)).padStart(2, "0")}
                    </span>
                    <span>60:00</span>
                  </div>
                </div>
              </div>

              {/* Title Suggestions Selector */}
              {activeRelease.titleSuggestions && activeRelease.titleSuggestions.length > 0 && (
                <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Kies Titelsuggestie voor SoundCloud
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {activeRelease.titleSuggestions.map((t, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const updated = { ...activeRelease, selectedTitle: t };
                          setActiveRelease(updated);
                          fetch(`/api/releases/${activeRelease.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(updated)
                          });
                        }}
                        className={`text-left p-2.5 rounded-lg border text-xs font-semibold transition ${
                          activeRelease.selectedTitle === t
                            ? "bg-orange-500/10 border-orange-500 text-orange-300"
                            : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                        }`}
                      >
                        {idx + 1}. {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Grid: Prompts & Metadata */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Artwork Prompts */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-orange-400" />
                    Artwork Studio (1:1 Cover Art)
                  </h3>

                  {activeRelease.artworkPrompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-3 shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-orange-400">
                          {prompt.styleName}
                        </span>
                        <button
                          onClick={() => copy(prompt.promptText, prompt.id)}
                          className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition"
                        >
                          {copiedKey === prompt.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          Kopieer Prompt
                        </button>
                      </div>

                      <p className="text-xs text-zinc-300 font-mono bg-zinc-950 p-3 rounded-lg border border-zinc-800 leading-relaxed">
                        {prompt.promptText}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        {prompt.generatedImageUrl ? (
                          <a
                            href={prompt.generatedImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-orange-400 hover:underline flex items-center gap-1 font-mono"
                          >
                            Bekijk High-Res Cover <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-zinc-500 font-mono">Nog niet gerenderd</span>
                        )}

                        <button
                          onClick={() => handleRenderArtwork(prompt)}
                          disabled={renderingArtwork === prompt.id}
                          className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-lg shadow-orange-600/20"
                        >
                          {renderingArtwork === prompt.id ? (
                            <>
                              <Sparkles className="w-3.5 h-3.5 animate-spin" />
                              Renderen...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              Genereer Cover
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tracklist & Metadata */}
                <div className="space-y-4">
                  {/* Tracklist Box */}
                  <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-2 shadow-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <Music className="w-4 h-4 text-orange-400" />
                        SoundCloud Timestamps & Tracklist
                      </h4>
                      <button
                        onClick={() => copy(activeRelease.tracklistFormatted, "tl")}
                        className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition"
                      >
                        {copiedKey === "tl" ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Kopieer Tracklist
                      </button>
                    </div>
                    <pre className="text-xs font-mono bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-zinc-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {activeRelease.tracklistFormatted}
                    </pre>
                  </div>

                  {/* Tags */}
                  <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-2 shadow-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-orange-400" />
                        SoundCloud Tags ({activeRelease.tags.length})
                      </h4>
                      <button
                        onClick={() => copy(activeRelease.tags.join(" "), "tags")}
                        className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition"
                      >
                        {copiedKey === "tags" ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Kopieer Alle Tags
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeRelease.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-orange-300 font-mono hover:border-orange-500/50 cursor-pointer"
                          onClick={() => copy(t, `tag_${idx}`)}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Description Preview */}
                  <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-2 shadow-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-orange-400" />
                        SoundCloud Description
                      </h4>
                      <button
                        onClick={() => copy(activeRelease.description, "desc")}
                        className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition"
                      >
                        {copiedKey === "desc" ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Kopieer Tekst
                      </button>
                    </div>
                    <p className="text-xs text-zinc-300 bg-zinc-950 p-3 rounded-lg border border-zinc-800 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                      {activeRelease.description}
                    </p>
                  </div>

                  {/* Social Kit */}
                  {activeRelease.socialKit && (
                    <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-3 shadow-lg">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-orange-400" />
                        Social Media Kit & Repost Pitch
                      </h4>

                      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs text-zinc-300 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-orange-400">Instagram / TikTok Copy:</span>
                          <button
                            onClick={() =>
                              copy(activeRelease.socialKit?.instagramCaption || "", "ig")
                            }
                            className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1"
                          >
                            {copiedKey === "ig" ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            Kopieer
                          </button>
                        </div>
                        <p className="whitespace-pre-line text-zinc-300 leading-relaxed">
                          {activeRelease.socialKit.instagramCaption}
                        </p>
                      </div>

                      {activeRelease.socialKit.repostOutreach && (
                        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs text-zinc-300 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-orange-400">SoundCloud Repost Outreach DM:</span>
                            <button
                              onClick={() =>
                                copy(activeRelease.socialKit?.repostOutreach || "", "dm")
                              }
                              className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1"
                            >
                              {copiedKey === "dm" ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              Kopieer
                            </button>
                          </div>
                          <p className="text-zinc-300 leading-relaxed">
                            {activeRelease.socialKit.repostOutreach}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[450px] flex flex-col items-center justify-center text-zinc-600 text-center">
              <Disc className="w-16 h-16 mb-3 animate-pulse text-zinc-700" />
              <p className="text-sm font-medium text-zinc-400">Geen release geselecteerd</p>
              <p className="text-xs text-zinc-500 max-w-sm mt-1">
                Vul links je Engine DJ tracklist of Denon session export in om direct de complete release kit te genereren.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
