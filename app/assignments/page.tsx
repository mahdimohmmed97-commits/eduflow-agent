import { Suspense } from "react";
import { AssignmentsView } from "@/components/assignments-view";
import { ContentSkeleton } from "@/components/skeletons";

export default function AssignmentsPage() {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <AssignmentsView />
    </Suspense>
  );
}
