import { redirect } from "next/navigation";

// This is the root page of the application. It redirects to the dashboard page.
export default function Home() {
  redirect("/dashboard");
}
