// 通用加载骨架屏组件

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3 animate-pulse">
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted rounded w-1/3" />
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-muted rounded-full" />
            <div className="h-6 w-20 bg-muted rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-muted rounded w-1/3" />
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="space-y-3">
        <div className="h-24 bg-muted rounded-lg" />
        <div className="h-24 bg-muted rounded-lg" />
      </div>
    </div>
  );
}
