import { ErrorBoundary } from "@/frontend/components/feedback/error-boundary";
import { ConversationsPage } from "@/frontend/features/conversations/pages/conversations-page";

export const metadata = {
  title: "Conversations — EstateFlow AI",
};

export default function Page() {
  return (
    <ErrorBoundary fallbackTitle="Conversations failed to load">
      <ConversationsPage />
    </ErrorBoundary>
  );
}
