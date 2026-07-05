import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Structured logger using pino.
 * - Production: JSON output for log aggregation
 * - Development: Pretty-printed output for readability
 */
export const logger = pino({
  level: isProduction ? "info" : "debug",
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }),
});
