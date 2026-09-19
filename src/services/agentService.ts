import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import pino from "pino";
import { env } from "../config/env.js";
import { GenerateReleaseInput, SoundcloudRelease, SoundcloudReleaseSchema } from "../types/release.js";
import { SOULCRAFT_SYSTEM_PROMPT } from "./promptTemplates.js";
import { EngineDjParser } from "./engineDjParser.js";

const logger = pino({ level: env.LOG_LEVEL });

export class ReleaseCopilotEngine {
  private model: any = null;

  constructor() {
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY !== "your_gemini_api_key_here") {
      try {
        const baseLlm = new ChatGoogleGenerativeAI({
          apiKey: env.GEMINI_API_KEY,
          modelName: "gemini-1.5-flash",
          temperature: 0.35,
        });
        this.model = baseLlm.withStructuredOutput(SoundcloudReleaseSchema);
      } catch (err: any) {
        logger.warn({ msg: err.message }, "Could not initialize live Gemini model, fallback active.");
      }
    }
  }

  async generateRelease(input: GenerateReleaseInput): Promise<{ success: boolean; data?: SoundcloudRelease; error?: string }> {
    logger.info({ vibe: input.vibeDescription }, "Starting Soulcraft Copilot Engine execution...");

    // 1. Parse de tracklist vooraf met de Engine DJ parser
    const { tracks, formattedString } = EngineDjParser.parseTracklist(
      input.rawTracklist || "",
      input.calculateTimestamps ?? true,
      input.averageTrackDurationMin ?? 4.5
    );

    const userInstructions = `
      Nieuwe Set Gegevens:
      - Vibe & Sfeer: ${input.vibeDescription}
      - Doelgroep: ${input.targetAudience}
      - BPM Range: ${input.bpmRange}
      - Reeds berekende tracklist met timestamps:
      ${formattedString || "Geen tracklist opgegeven, genereer passende demonstratie tracks met timestamps."}

      Genereer een complete SoundCloud Release Kit inclusief artwork prompts en social media kit.
    `;

    // 2. Try live LLM execution if model is available
    if (this.model) {
      try {
        const generated = await this.model.invoke([
          { role: "system", content: SOULCRAFT_SYSTEM_PROMPT },
          { role: "user", content: userInstructions }
        ]);

        const completeRelease: SoundcloudRelease = {
          ...generated,
          id: generated.id || `rel_${Date.now()}`,
          createdAt: generated.createdAt || new Date().toISOString(),
          parsedTracks: tracks.length > 0 ? tracks : generated.parsedTracks,
          tracklistFormatted: formattedString || generated.tracklistFormatted,
          selectedTitle: generated.selectedTitle || generated.titleSuggestions[0] || "Soulcraft Live Session",
          status: "ready"
        };

        logger.info({ id: completeRelease.id, title: completeRelease.selectedTitle }, "Release kit successfully compiled via Gemini.");
        return { success: true, data: completeRelease };
      } catch (err: any) {
        logger.error({ error: err.message }, "Gemini structured output call failed, trying fallback compilation.");
      }
    }

    // 3. Fallback / Offline / Demo mode with rich Soulcraft curation
    logger.info("Generating curated Soulcraft release kit (Local Studio Engine)...");
    const demoRelease: SoundcloudRelease = {
      id: `rel_${Date.now()}`,
      createdAt: new Date().toISOString(),
      titleSuggestions: [
        "Soulcraft Sessions 003: Midnight Jack & Rolling Bass",
        "Warehouse Echoes: Chicago Deep & Raw Transients",
        "Denon SC Live 2 Cut: Analog Warmth Vol. 1",
        "The Jackin Groove Tape: Underground 909 Session"
      ],
      selectedTitle: "Soulcraft Sessions 003: Midnight Jack & Rolling Bass",
      primaryGenre: "Chicago House",
      subGenres: ["Jackin House", "Tech House", "Deep House"],
      tags: [
        "#ChicagoHouse",
        "#JackinHouse",
        "#TechHouse",
        "#SoulcraftSessions",
        "#DenonSCLive2",
        "#UndergroundHouse",
        "#HouseMusic",
        "#VinylVibes",
        "#ClubSession",
        "#SoundCloudMix"
      ],
      description: `Step into the raw energy of Soulcraft Sessions. Recorded live on the Denon SC Live 2 controller.\n\nFeaturing warm analog basslines, punchy 909 percussive drive, and hypnotic rolling grooves tailored for peak-time dancefloors and late night headphone listening.\n\nTurn up the low end, hit repost if you feel the bounce, and let the groove take over.`,
      tracklistFormatted: formattedString || [
        "00:00 | Dennis Quin - Chant Groove",
        "04:30 | Kerri Chandler - Atmosphere (Jerome Sydenham Remix)",
        "09:00 | Soulcraft - Midnight Jack (Original Mix)",
        "13:30 | Floorplan - Never Grow Old",
        "18:00 | Catz 'n Dogz - Jack (Club Tool)"
      ].join("\n"),
      parsedTracks: tracks.length > 0 ? tracks : EngineDjParser.parseTracklist([
        "Dennis Quin - Chant Groove",
        "Kerri Chandler - Atmosphere (Jerome Sydenham Remix)",
        "Soulcraft - Midnight Jack (Original Mix)",
        "Floorplan - Never Grow Old",
        "Catz 'n Dogz - Jack (Club Tool)"
      ].join("\n"), true, 4.5).tracks,
      artworkPrompts: [
        {
          id: "art_1",
          styleName: "Brutalist Warehouse at Dawn",
          promptText: "Brutalist concrete warehouse rave at 5 AM, warm amber sunlight piercing through high clerestory windows, heavy atmospheric haze, DJ booth in silhouette with glowing Denon jogwheels, 35mm film photography, Kodak Portra 400 grain, high contrast, 1:1 aspect ratio",
          aspectRatio: "1:1",
          negativePrompt: "text, watermark, blurry, low resolution, deformed"
        },
        {
          id: "art_2",
          styleName: "Analog Neon Noir Studio",
          promptText: "Close-up macro shot of vintage modular synthesizers, glowing amber LED meters, analog patch cables, hazy smoke reflection on vinyl turntable, cinematic moody studio lighting, 50mm f/1.2 lens, shallow depth of field, 1:1 aspect ratio",
          aspectRatio: "1:1",
          negativePrompt: "oversaturated, digital render, CGI"
        },
        {
          id: "art_3",
          styleName: "Deep Terrace Golden Hour",
          promptText: "Rooftop terrace sound system overlooking industrial canal, golden hour rim lighting, vinyl crates stacked, subtle lens flare, minimalist chic club aesthetic, analog photo grain, 1:1 aspect ratio",
          aspectRatio: "1:1"
        }
      ],
      releaseStrategyTips: [
        "Post on Thursday at 18:00 CET — peak discovery window before the weekend club rush.",
        "Clip the transition at 09:00 into a 15-second teaser reel showing the SC Live 2 jogwheel spin.",
        "Share the tracklist on Instagram Stories with interactive timestamp stickers."
      ],
      socialKit: {
        instagramCaption: "Fresh session in the vault 🔊 Raw Chicago jackin drums and rolling basslines straight off the Denon SC Live 2.\n\nTracklist & full 60-min tape live on SoundCloud now! Link in bio. What's your favourite transition?\n\n#HouseMusic #ChicagoHouse #TechHouse #Soulcraft #DenonDJ #SoundCloudMix",
        tiktokHooks: [
          "When the 909 bassline drops at 09:00 😮‍💨",
          "Denon SC Live 2 standalone session: House grooves only 🔥",
          "Building that 3 AM Chicago energy..."
        ],
        repostOutreach: "Hey team! Loved your latest repost playlist. Just dropped a fresh high-energy Jackin & Chicago House session with live Denon SC Live 2 flow: 'Soulcraft Sessions 003'. Would love to be considered for your next rotation if it fits your groove!"
      },
      status: "ready"
    };

    return { success: true, data: demoRelease };
  }
}
