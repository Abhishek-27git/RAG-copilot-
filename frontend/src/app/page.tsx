import { redirect } from "next/navigation";

/**
 * Root page redirects to dashboard.
 * Next.js Middleware automatically intercepts and handles login redirects.
 */
export default function HomePage() {
  redirect("/dashboard");
}
