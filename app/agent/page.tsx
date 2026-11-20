import { Suspense } from "react";
import { AgentView } from "@/components/agent-view";
import { ContentSkeleton } from "@/components/skeletons";

export default function AgentPage() {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <AgentView />
    </Suspense>
  );
}
