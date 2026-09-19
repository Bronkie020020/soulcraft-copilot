import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "node:path";
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

  const publicDir = path.resolve(process.cwd(), "public");
  await app.register(fastifyStatic, {
    root: publicDir,
    prefix: "/",
  });

  await registerRoutes(app);

  return app;
}
