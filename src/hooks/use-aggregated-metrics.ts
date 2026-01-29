import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

export interface EmployeeMetrics {
    id: string;
    name: string;
    email: string;
    totalHours: number;
    expectedHours: number;
    completionPercentage: number;
    isComplete: boolean;
}

export interface AggregatedMetrics {
    period: {
        start: string;
        end: string;
        weekdays: number;
        expectedHoursPerEmployee: number;
    };
    summary: {
        totalEmployees: number;
        completeEmployees: number;
        incompleteEmployees: number;
        completionRate: number;
        averageHoursPerEmployee: number;
        totalHoursLogged: number;
        oldIncompleteCount: number;
    };
    chargeCodeBreakdown: {
        code: string;
        description: string;
        totalHours: number;
    }[];
    incompleteEmployeesList: EmployeeMetrics[];
    completeEmployeesList: EmployeeMetrics[];
}

async function fetchAggregatedMetrics(
    periodStart: Date,
    periodEnd: Date
): Promise<AggregatedMetrics> {
    const params = new URLSearchParams({
        periodStart: format(periodStart, "yyyy-MM-dd"),
        periodEnd: format(periodEnd, "yyyy-MM-dd"),
    });

    const response = await fetch(`/api/admin/aggregated-metrics?${params}`);
    if (!response.ok) {
        throw new Error("Failed to fetch aggregated metrics");
    }
    return response.json();
}

export function useAggregatedMetrics(periodStart: Date, periodEnd: Date) {
    return useQuery({
        queryKey: [
            "aggregatedMetrics",
            format(periodStart, "yyyy-MM-dd"),
            format(periodEnd, "yyyy-MM-dd"),
        ],
        queryFn: () => fetchAggregatedMetrics(periodStart, periodEnd),
    });
}
