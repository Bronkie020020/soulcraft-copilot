import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import fs from "node:fs";
import { registerRoutes } from "./routes.js";
import { env } from "../config/env.js";

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      },
    },
  });

  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  });

  // 1. Artwork & public static assets
  const publicDir = path.resolve(process.cwd(), "public");
  await app.register(fastifyStatic, {
    root: publicDir,
    prefix: "/public/",
    decorateReply: false,
  });

  // Specifically serve /artwork prefix
  const artworkDir = path.resolve(process.cwd(), "public", "artwork");
  await app.register(fastifyStatic, {
    root: artworkDir,
    prefix: "/artwork/",
    decorateReply: false,
  });

  // 2. Client React SPA (production build)
  const clientDist = path.resolve(process.cwd(), "dist", "client");
  if (fs.existsSync(clientDist)) {
    await app.register(fastifyStatic, {
      root: clientDist,
      prefix: "/",
      decorateReply: true,
    });

    // SPA fallback for client-side routing
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith("/api") || req.url.startsWith("/artwork")) {
        return reply.status(404).send({ success: false, error: "Endpoint not found" });
      }
      return reply.sendFile("index.html");
    });
  }

  await registerRoutes(app);

  return app;
}
