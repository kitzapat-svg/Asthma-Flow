import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-24" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-48 w-full rounded-xl" />
                ))}
            </div>
        </div>
    );
}
