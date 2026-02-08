import { ErrorBoundary } from "@/frontend/components/feedback/error-boundary";
import { DashboardPage } from "@/frontend/features/dashboard/pages/dashboard-page";

export const metadata = {
  title: "Dashboard — EstateFlow AI",
};

export default function Page() {
  return (
    <ErrorBoundary fallbackTitle="Dashboard failed to load">
      <DashboardPage />
    </ErrorBoundary>
  );
}
