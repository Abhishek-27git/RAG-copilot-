import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

/**
 * Client-side Better Auth configuration.
 *
 * Imports from "better-auth/react" to get reactive hooks (useSession).
 * Organization client plugin for multi-tenant org switching.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  plugins: [organizationClient()],
});

export const { useSession, signIn, signUp, signOut } = authClient;
