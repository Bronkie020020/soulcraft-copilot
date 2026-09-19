import React, { useState } from "react";
import {
  Sparkles,
  Terminal,
  Copy,
  Check,
  ArrowRight,
  RotateCcw,
  Layers,
  Wand2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Tag,
  Music,
  HardDrive
} from "lucide-react";

interface DynamicQuestion {
  id: string;
  question: string;
  description: string;
  options: {
    label: string;
    value: string;
    description?: string;
  }[];
}

interface IntakeAnalysis {
  category: string;
  title: string;
  summary: string;
  questions: DynamicQuestion[];
}

interface PromptResult {
  prompt: string;
  title: string;
  executionPlan: string[];
  suggestedAction: string;
}

interface CleanedTrack {
  original: string;
  cleanedArtist: string;
  cleanedTitle: string;
  fullCleaned: string;
  removedJunk: string[];
  isDuplicate?: boolean;
}

interface SmartCue {
  id: string;
  name: string;
  timeSec: number;
  timestamp: string;
  color: string;
  type: string;
}

const PRESETS = [
  {
    title: "Serato ➔ Rekordbox Migratie",
    desc: "Neem alle hot cues, beatgrids en playlists over",
    text: "Ik stap over van Serato DJ Pro naar Pioneer Rekordbox. Al mijn cue points, loops en playlists moeten mee en mijn toonsoorten moeten naar Camelot Wheel."
  },
  {
    title: "Website URL & Junk Tag Cleaner",
    desc: "Verwijder ://downloadmp3.com, [Official Video] en prefixes",
    text: "Mijn muziekbibliotheek staat vol met download-sites in de titels zoals ://downloadmp3.com, [Official Video] en nummering zoals 01 - . Schoon al mijn tags en titels netjes op."
  },
  {
    title: "8-Point Auto Cue & Grid Aligner",
    desc: "AI plaatsing van Intro, Drops, Breakdown en Outro",
    text: "Ik wil automatische 8-point smart cues plaatsen op al mijn club tracks met duidelijke DJ-kleuren (Intro, Verse, Chorus, Build, Drop 1, Break, Drop 2, Outro) en het beatgrid strakzetten."
  },
  {
    title: "Lexicon DJ Ultimate Overhaul",
    desc: "Duplicates opsporen, Camelot conversie & Rekordbox export",
    text: "Voer een complete Lexicon DJ Ultimate bibliotheekrevisie uit: spoor dubbele bestanden op via audio fingerprinting, converteer keys naar Camelot en bereid een universele Rekordbox XML voor."
  }
];

export default function DjPromptCreator() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [intake, setIntake] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<IntakeAnalysis | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generatedResult, setGeneratedResult] = useState<PromptResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Direct execution state
  const [executing, setExecuting] = useState(false);
  const [executionData, setExecutionData] = useState<{
    cleanedTracks?: CleanedTrack[];
    smartCues?: SmartCue[];
  } | null>(null);

  // Scherm 1 ➔ Scherm 2: Analyseer Intake
  async function handleStartIntake() {
    if (!intake.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/dj-prompt/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setAnalysis(json.data);
        // Default selecties instellen
        const defaults: Record<string, string> = {};
        for (const q of json.data.questions) {
          if (q.options.length > 0) {
            defaults[q.id] = q.options[0].value;
          }
        }
        setAnswers(defaults);
        setStep(2);
      }
    } catch (err) {
      console.error("Intake analyse fout:", err);
    } finally {
      setLoading(false);
    }
  }

  // Scherm 2 ➔ Scherm 3: Genereer Prompt
  async function handleGeneratePrompt() {
    if (!analysis) return;
    setLoading(true);
    try {
      const res = await fetch("/api/dj-prompt/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake,
          category: analysis.category,
          answers
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setGeneratedResult(json.data);
        setStep(3);
      }
    } catch (err) {
      console.error("Prompt generatie fout:", err);
    } finally {
      setLoading(false);
    }
  }

  // Scherm 3: Voer Direct Uit in Studio
  async function handleExecuteDirectly() {
    setExecuting(true);
    try {
      const isCueAction = generatedResult?.suggestedAction === "SMART_CUES";
      const moduleType = isCueAction ? "smart-cues" : "tag-cleanup";

      const res = await fetch("/api/dj-prompt/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: moduleType,
          durationSec: 360,
          bpm: 126
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        if (isCueAction) {
          setExecutionData({ smartCues: json.data.cues });
        } else {
          setExecutionData({ cleanedTracks: json.data.tracks });
        }
      }
    } catch (err) {
      console.error("Directe executie fout:", err);
    } finally {
      setExecuting(false);
    }
  }

  function handleCopy() {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setStep(1);
    setIntake("");
    setAnalysis(null);
    setAnswers({});
    setGeneratedResult(null);
    setExecutionData(null);
  }

  return (
    <div className="flex-1 bg-zinc-950 p-6 overflow-y-auto max-w-6xl mx-auto w-full flex flex-col gap-6">
      {/* Studio Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-zinc-900 border border-orange-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold flex items-center gap-1">
                <Wand2 className="w-3 h-3 text-orange-400" />
                Lexicon DJ Ultimate & UPC Architecture
              </span>
              <span className="text-[10px] font-mono text-zinc-500">v9.0 Engine</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              ULTIMATE DJ PROMPT CREATOR
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Combineert de interactieve prompt-engineering logica van de Ultimate Prompt Creator met geavanceerde bibliotheekconversie, audio fingerprinting en smart cues van Lexicon DJ.
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 bg-zinc-950/70 p-2 rounded-xl border border-zinc-800 font-mono text-xs">
            <span className={`px-2.5 py-1 rounded-lg ${step === 1 ? "bg-orange-600 text-white font-bold" : "text-zinc-500"}`}>
              1. Intake
            </span>
            <span className="text-zinc-600">➔</span>
            <span className={`px-2.5 py-1 rounded-lg ${step === 2 ? "bg-orange-600 text-white font-bold" : "text-zinc-500"}`}>
              2. Wizard
            </span>
            <span className="text-zinc-600">➔</span>
            <span className={`px-2.5 py-1 rounded-lg ${step === 3 ? "bg-orange-600 text-white font-bold" : "text-zinc-500"}`}>
              3. Prompt & Fixes
            </span>
          </div>
        </div>
      </div>

      {/* SCHERM 1: HET DASHBOARD (DE INTAKE) */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 flex flex-col gap-5 shadow-lg">
            <div>
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-orange-400" />
                Beschrijf je huidige DJ bibliotheek situatie of wens:
              </label>
              <p className="text-xs text-zinc-400 mt-0.5">
                Typ in eigen woorden wat je wilt converteren, opschonen of optimaliseren (bijv. software overstap, rommelige titels of cue points).
              </p>
            </div>

            <textarea
              value={intake}
              onChange={(e) => setIntake(e.target.value)}
              placeholder="Bijvoorbeeld: Ik stap over van Serato naar Rekordbox en al mijn cues moeten mee, en mijn titels zijn een zooitje met download sites..."
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-sans transition resize-none leading-relaxed"
            />

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] uppercase font-mono tracking-wider text-zinc-500 font-bold block mb-2">
                Snelle Scenario Presets (Klik om in te laden):
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setIntake(p.text)}
                    className="text-left bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/60 hover:border-orange-500/40 p-3 rounded-xl transition group"
                  >
                    <div className="text-xs font-bold text-zinc-200 group-hover:text-orange-400 transition">
                      {p.title}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleStartIntake}
                disabled={loading || !intake.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-sm font-bold shadow-lg shadow-orange-600/30 flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Intake Analyseren...
                  </>
                ) : (
                  <>
                    Start Ultimate Creator
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHERM 2: DE INTERACTIEVE VRAGEN-WIZARD */}
      {step === 2 && analysis && (
        <div className="flex flex-col gap-6">
          {/* Analysis Summary Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20">
                Gedetecteerde Focus: {analysis.category}
              </span>
              <h3 className="text-base font-black text-white mt-1">{analysis.title}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">{analysis.summary}</p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Pas Intake Aan
            </button>
          </div>

          {/* Dynamic Questions Form */}
          <div className="flex flex-col gap-5">
            {analysis.questions.map((q) => (
              <div key={q.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                    {q.question}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">{q.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                  {q.options.map((opt) => {
                    const isSelected = answers[q.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))}
                        className={`text-left p-3.5 rounded-xl border transition flex flex-col gap-1 ${
                          isSelected
                            ? "bg-orange-500/10 border-orange-500 text-white ring-1 ring-orange-500/50 shadow-md shadow-orange-500/10"
                            : "bg-zinc-950/70 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{opt.label}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0" />}
                        </div>
                        {opt.description && (
                          <span className="text-[11px] text-zinc-400 leading-snug">{opt.description}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition"
            >
              Terug naar Intake
            </button>
            <button
              type="button"
              onClick={handleGeneratePrompt}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-sm font-bold shadow-lg shadow-orange-600/30 flex items-center gap-2 transition"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Prompt Genereren...
                </>
              ) : (
                <>
                  Genereer Expert Prompt & Acties
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* SCHERM 3: HET PROMPT- & ACTIE-OUTPUT SCHERM */}
      {step === 3 && generatedResult && (
        <div className="flex flex-col gap-6">
          {/* Top Control Bar */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-black text-white">{generatedResult.title}</h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Klaar voor gebruik in Lexicon DJ, Python tools of directe studio-uitvoering.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Gekopieerd!" : "Kopieer Prompt"}
              </button>

              <button
                type="button"
                onClick={handleExecuteDirectly}
                disabled={executing}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-orange-600/30"
              >
                {executing ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    Uitvoeren...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Voer Direct Uit in Studio
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white text-xs transition"
                title="Nieuwe Prompt"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Expert Prompt Code Block */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-zinc-900/90 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/80"></span>
                <span className="ml-2 text-zinc-300 font-semibold">ultimate_dj_prompt.md</span>
              </div>
              <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">UPC / Lexicon Engine</span>
            </div>
            <pre className="p-5 text-xs text-zinc-300 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap selection:bg-orange-500 selection:text-white">
              {generatedResult.prompt}
            </pre>
          </div>

          {/* Direct Execution Result Drawer */}
          {executionData && (
            <div className="bg-zinc-900/70 border border-orange-500/30 rounded-2xl p-6 flex flex-col gap-4 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-orange-400" />
                  Direct Studio Uitvoeringsresultaat
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  Succesvol Uitgevoerd
                </span>
              </div>

              {/* Tag Cleanup Result Table */}
              {executionData.cleanedTracks && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-zinc-400">
                    Onderstaande tracks zijn opgeschoond volgens de Lexicon DJ Ultimate junk-filter regels:
                  </p>
                  <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800/60 text-xs">
                    {executionData.cleanedTracks.map((t, idx) => (
                      <div key={idx} className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{t.fullCleaned}</span>
                            {t.isDuplicate && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-mono font-bold border border-red-500/30">
                                DUPLICATE
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-500 line-through mt-0.5">{t.original}</span>
                        </div>
                        {t.removedJunk.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {t.removedJunk.map((j, jIdx) => (
                              <span key={jIdx} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-orange-400 border border-zinc-800">
                                Strip: {j}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Smart Cues Result Table */}
              {executionData.smartCues && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-zinc-400">
                    Gegenereerde 8 Smart Cue points met BPM-Dex kleurencodes en structurele markeringen:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {executionData.smartCues.map((c) => (
                      <div key={c.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }}></span>
                          <span className="text-xs font-bold text-white truncate">{c.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono mt-1">
                          <span>{c.timestamp}</span>
                          <span className="text-[10px] uppercase font-bold" style={{ color: c.color }}>{c.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
