/**
 * Better Auth API catch-all route handler.
 *
 * Method: ALL (GET, POST, etc.)
 * Path: /api/auth/[...all]
 * Auth: Public (handles its own auth)
 *
 * Delegates all /api/auth/* requests to Better Auth's handler.
 */
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth.handler);
