export function ContentSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-36 animate-pulse rounded-[28px] bg-white/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/70" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-3xl bg-white/70" />
    </div>
  );
}
