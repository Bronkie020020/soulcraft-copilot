import { buildServer } from "./server/server.js";
import { env } from "./config/env.js";

export * from "./types/release.js";
export * from "./types/engineDj.js";
export * from "./services/agentService.js";
export * from "./services/engineDjParser.js";
export * from "./services/storageService.js";
export * from "./services/imageService.js";
export * from "./services/promptTemplates.js";
export * from "./config/env.js";

async function main() {
  try {
    const server = await buildServer();
    const address = await server.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`\n🎧 [Soulcraft Engine] Fastify Server listening on ${address}`);
    console.log(`🎛️  [Studio Suite] API ready: ${address}/api/releases\n`);
  } catch (err) {
    console.error("Failed to start Soulcraft Copilot server:", err);
    process.exit(1);
  }
}

// Start server if run directly
main();
