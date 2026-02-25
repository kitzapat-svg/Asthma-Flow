export default function DashboardLoading() {
    return (
        <div className="space-y-8 pb-20 animate-fade-up">
            {/* Skeleton Header */}
            <div className="flex justify-between items-end">
                <div>
                    <div className="h-8 w-40 skeleton-shimmer rounded-lg" />
                    <div className="h-4 w-56 skeleton-shimmer rounded mt-2" />
                </div>
                <div className="h-10 w-36 skeleton-shimmer rounded-lg" />
            </div>
            {/* Skeleton Stat Cards (matches 2x2 → 4-col grid) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="stat-card p-6">
                        <div className="h-5 w-5 skeleton-shimmer rounded mb-4" />
                        <div className="h-3 w-24 skeleton-shimmer rounded mb-2" />
                        <div className="h-9 w-16 skeleton-shimmer rounded" />
                    </div>
                ))}
            </div>
            {/* Skeleton Patient Rows */}
            <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="glass-card p-4 rounded-2xl flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-full skeleton-shimmer" />
                        <div className="flex-1 space-y-2">
                            <div className="h-5 w-48 skeleton-shimmer rounded" />
                            <div className="h-3 w-32 skeleton-shimmer rounded" />
                        </div>
                        <div className="h-4 w-20 skeleton-shimmer rounded hidden md:block" />
                    </div>
                ))}
            </div>
        </div>
    );
}
