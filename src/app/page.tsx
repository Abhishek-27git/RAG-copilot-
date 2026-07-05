import { redirect } from "next/navigation";

/**
 * Root page — redirects to the dashboard.
 * Auth middleware will handle redirecting to /login if unauthenticated.
 */
export default function RootPage(): never {
  redirect("/dashboard");
}
