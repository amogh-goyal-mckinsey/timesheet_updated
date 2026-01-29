"use client";

import { useState, useMemo } from "react";
import { format, endOfMonth } from "date-fns";
import { useAggregatedMetrics } from "@/hooks/use-aggregated-metrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    Users,
    CheckCircle,
    AlertCircle,
    Clock,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertTriangle,
} from "lucide-react";

/**
 * Get the current semi-monthly period for a given date
 * Period 1: 1st to 15th
 * Period 2: 16th to end of month
 */
function getCurrentPeriod(date: Date): { start: Date; end: Date } {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    if (day <= 15) {
        return {
            start: new Date(year, month, 1),
            end: new Date(year, month, 15),
        };
    } else {
        return {
            start: new Date(year, month, 16),
            end: endOfMonth(new Date(year, month, 1)),
        };
    }
}

function getPreviousPeriod(currentStart: Date): { start: Date; end: Date } {
    const year = currentStart.getFullYear();
    const month = currentStart.getMonth();
    const day = currentStart.getDate();

    if (day === 1) {
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        return {
            start: new Date(prevYear, prevMonth, 16),
            end: endOfMonth(new Date(prevYear, prevMonth, 1)),
        };
    } else {
        return {
            start: new Date(year, month, 1),
            end: new Date(year, month, 15),
        };
    }
}

function getNextPeriod(currentStart: Date): { start: Date; end: Date } {
    const year = currentStart.getFullYear();
    const month = currentStart.getMonth();
    const day = currentStart.getDate();

    if (day === 1) {
        return {
            start: new Date(year, month, 16),
            end: endOfMonth(new Date(year, month, 1)),
        };
    } else {
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        return {
            start: new Date(nextYear, nextMonth, 1),
            end: new Date(nextYear, nextMonth, 15),
        };
    }
}

export default function AdminDashboardPage() {
    // Period state - default to current semi-monthly period
    const initialPeriod = useMemo(() => getCurrentPeriod(new Date()), []);
    const [periodStart, setPeriodStart] = useState(initialPeriod.start);
    const [periodEnd, setPeriodEnd] = useState(initialPeriod.end);

    // Employee filter state
    const [employeeFilter, setEmployeeFilter] = useState<"all" | "complete" | "incomplete">("all");

    const { data, isLoading, error } = useAggregatedMetrics(periodStart, periodEnd);

    const handlePreviousPeriod = () => {
        const prev = getPreviousPeriod(periodStart);
        setPeriodStart(prev.start);
        setPeriodEnd(prev.end);
    };

    const handleNextPeriod = () => {
        const next = getNextPeriod(periodStart);
        setPeriodStart(next.start);
        setPeriodEnd(next.end);
    };

    const handleCurrentPeriod = () => {
        const current = getCurrentPeriod(new Date());
        setPeriodStart(current.start);
        setPeriodEnd(current.end);
    };

    // Filtered employees based on filter selection
    const filteredEmployees = useMemo(() => {
        if (!data) return [];

        if (employeeFilter === "complete") {
            return data.completeEmployeesList || [];
        } else if (employeeFilter === "incomplete") {
            return data.incompleteEmployeesList || [];
        } else {
            // All - combine both lists
            return [
                ...(data.completeEmployeesList || []),
                ...(data.incompleteEmployeesList || []),
            ].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        }
    }, [data, employeeFilter]);

    // Chart colors
    const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-96 text-red-500">
                <p>Error loading metrics</p>
            </div>
        );
    }

    const pieData = [
        { name: "Complete", value: data?.summary.completeEmployees || 0 },
        { name: "Incomplete", value: data?.summary.incompleteEmployees || 0 },
    ];

    // Period label for display
    const periodLabel = periodStart.getDate() === 1
        ? `${format(periodStart, "MMMM yyyy")} (1st - 15th)`
        : `${format(periodStart, "MMMM yyyy")} (16th - ${format(periodEnd, "d")})`;

    return (
        <div className="p-6 lg:p-8 space-y-6">
            {/* Header with period selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-1">
                        Aggregated timesheet metrics and completion status
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePreviousPeriod}
                        className="border-gray-200 hover:bg-gray-50"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 min-w-[280px] text-center">
                        <span className="text-gray-700 font-medium">
                            {periodLabel}
                        </span>
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextPeriod}
                        className="border-gray-200 hover:bg-gray-50"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCurrentPeriod}
                        className="ml-2 border-gray-200 hover:bg-gray-50"
                    >
                        Current
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Total Employees
                        </CardTitle>
                        <Users className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {data?.summary.totalEmployees || 0}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Completion Rate
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {data?.summary.completionRate || 0}%
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {data?.summary.completeEmployees} of {data?.summary.totalEmployees} complete
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Avg Hours/Employee
                        </CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {data?.summary.averageHoursPerEmployee || 0}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Expected: {data?.period.expectedHoursPerEmployee || 70} hrs
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Old Incomplete
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {data?.summary.oldIncompleteCount || 0}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            From 2+ weeks ago
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hours by Charge Code Bar Chart */}
                <Card className="lg:col-span-2 bg-white border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-gray-900">Hours by Charge Code</CardTitle>
                        <CardDescription className="text-gray-500">
                            Total hours logged per charge code for the selected period
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data?.chargeCodeBreakdown || []}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis type="number" stroke="#6b7280" fontSize={12} />
                                    <YAxis
                                        type="category"
                                        dataKey="code"
                                        stroke="#6b7280"
                                        fontSize={12}
                                        width={70}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "white",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "8px",
                                        }}
                                        formatter={(value) => [`${value} hours`, "Total"]}
                                    />
                                    <Bar dataKey="totalHours" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Completion Pie Chart */}
                <Card className="bg-white border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-gray-900">Completion Status</CardTitle>
                        <CardDescription className="text-gray-500">
                            Employee completion breakdown
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        <Cell fill="#10b981" />
                                        <Cell fill="#ef4444" />
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "white",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "8px",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-sm text-gray-600">Complete ({data?.summary.completeEmployees})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="text-sm text-gray-600">Incomplete ({data?.summary.incompleteEmployees})</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Employees Table */}
            <Card className="bg-white border-gray-200">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-gray-900">Employee Timesheets</CardTitle>
                        </div>
                        <select
                            value={employeeFilter}
                            onChange={(e) => setEmployeeFilter(e.target.value as "all" | "complete" | "incomplete")}
                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Employees</option>
                            <option value="complete">Complete</option>
                            <option value="incomplete">Incomplete</option>
                        </select>
                    </div>
                    <CardDescription className="text-gray-500">
                        {employeeFilter === "all"
                            ? "All employees for the selected period"
                            : employeeFilter === "complete"
                                ? "Employees who have completed their timesheets"
                                : "Employees who haven't completed their timesheets"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredEmployees.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            {employeeFilter === "incomplete" ? (
                                <>
                                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                                    <p>All employees have completed their timesheets!</p>
                                </>
                            ) : employeeFilter === "complete" ? (
                                <>
                                    <AlertCircle className="h-12 w-12 mx-auto mb-2 text-orange-500" />
                                    <p>No employees have completed their timesheets yet.</p>
                                </>
                            ) : (
                                <p>No employees found.</p>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-gray-600">Employee</TableHead>
                                    <TableHead className="text-gray-600">Email</TableHead>
                                    <TableHead className="text-right text-gray-600">Hours Logged</TableHead>
                                    <TableHead className="text-right text-gray-600">Expected</TableHead>
                                    <TableHead className="text-right text-gray-600">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.map((employee) => (
                                    <TableRow key={employee.id}>
                                        <TableCell className="font-medium text-gray-900">
                                            {employee.name}
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            {employee.email}
                                        </TableCell>
                                        <TableCell className="text-right text-gray-900">
                                            {employee.totalHours}
                                        </TableCell>
                                        <TableCell className="text-right text-gray-500">
                                            {employee.expectedHours}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge
                                                className={
                                                    employee.isComplete
                                                        ? "bg-green-100 text-green-700"
                                                        : employee.completionPercentage >= 75
                                                            ? "bg-orange-100 text-orange-700"
                                                            : employee.completionPercentage >= 50
                                                                ? "bg-yellow-100 text-yellow-700"
                                                                : "bg-red-100 text-red-700"
                                                }
                                            >
                                                {employee.isComplete ? "Complete" : `${employee.completionPercentage}%`}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
