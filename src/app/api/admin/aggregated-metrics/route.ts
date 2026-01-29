import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { format, endOfMonth } from "date-fns";

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

/**
 * Get the previous semi-monthly period
 */
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

// GET: Fetch aggregated metrics for admin dashboard
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !session.user.roles.includes("ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const periodStart = searchParams.get("periodStart");
        const periodEnd = searchParams.get("periodEnd");

        // Default to current semi-monthly period if not specified
        const today = new Date();
        const defaultPeriod = getCurrentPeriod(today);

        const startDate = periodStart ? new Date(periodStart) : defaultPeriod.start;
        const endDate = periodEnd ? new Date(periodEnd) : defaultPeriod.end;

        // Get all employees (users with EMPLOYEE role)
        const employees = await prisma.user.findMany({
            where: {
                roles: {
                    has: "EMPLOYEE",
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        // Get all time entries for the period
        const entries = await prisma.timeEntry.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                chargeCode: {
                    select: {
                        id: true,
                        code: true,
                        description: true,
                    },
                },
            },
        });

        // Calculate aggregated metrics

        // 1. Hours per charge code
        const hoursPerChargeCode = new Map<string, { code: string; description: string; totalHours: number }>();
        entries.forEach((entry) => {
            const existing = hoursPerChargeCode.get(entry.chargeCodeId);
            if (existing) {
                existing.totalHours += entry.hours;
            } else {
                hoursPerChargeCode.set(entry.chargeCodeId, {
                    code: entry.chargeCode.code,
                    description: entry.chargeCode.description,
                    totalHours: entry.hours,
                });
            }
        });

        // 2. Calculate completion per employee
        // Count weekdays in period
        let weekdayCount = 0;
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const day = currentDate.getDay();
            if (day !== 0 && day !== 6) {
                weekdayCount++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        const expectedHours = weekdayCount * 7; // 7 hours per weekday

        // Hours per employee
        const hoursPerEmployee = new Map<string, number>();
        entries.forEach((entry) => {
            const current = hoursPerEmployee.get(entry.userId) || 0;
            hoursPerEmployee.set(entry.userId, current + entry.hours);
        });

        // Identify incomplete employees
        const incompleteEmployees = employees
            .map((emp) => {
                const totalHours = hoursPerEmployee.get(emp.id) || 0;
                return {
                    id: emp.id,
                    name: emp.name,
                    email: emp.email,
                    totalHours,
                    expectedHours,
                    completionPercentage: expectedHours > 0 ? Math.round((totalHours / expectedHours) * 100) : 0,
                    isComplete: totalHours >= expectedHours,
                };
            })
            .filter((emp) => emp.totalHours < expectedHours)
            .sort((a, b) => a.completionPercentage - b.completionPercentage);

        // Identify complete employees
        const completeEmployeesList = employees
            .map((emp) => {
                const totalHours = hoursPerEmployee.get(emp.id) || 0;
                return {
                    id: emp.id,
                    name: emp.name,
                    email: emp.email,
                    totalHours,
                    expectedHours,
                    completionPercentage: expectedHours > 0 ? Math.round((totalHours / expectedHours) * 100) : 0,
                    isComplete: totalHours >= expectedHours,
                };
            })
            .filter((emp) => emp.totalHours >= expectedHours)
            .sort((a, b) => b.totalHours - a.totalHours);

        // 3. Summary metrics
        const totalEmployees = employees.length;
        const completeEmployees = employees.filter(
            (emp) => (hoursPerEmployee.get(emp.id) || 0) >= expectedHours
        ).length;
        const completionRate = totalEmployees > 0 ? Math.round((completeEmployees / totalEmployees) * 100) : 0;

        const totalHoursLogged = Array.from(hoursPerEmployee.values()).reduce(
            (sum, hrs) => sum + hrs,
            0
        );
        const averageHoursPerEmployee = totalEmployees > 0
            ? Math.round(totalHoursLogged / totalEmployees)
            : 0;

        // 4. Hours by charge code (for chart)
        const chargeCodeData = Array.from(hoursPerChargeCode.values())
            .sort((a, b) => b.totalHours - a.totalHours)
            .slice(0, 10); // Top 10 charge codes

        // 5. Check for old incomplete periods (previous semi-monthly period)
        const previousPeriod = getPreviousPeriod(startDate);

        const oldEntries = await prisma.timeEntry.findMany({
            where: {
                date: {
                    gte: previousPeriod.start,
                    lte: previousPeriod.end,
                },
            },
        });

        // Count weekdays in previous period
        let prevWeekdayCount = 0;
        const prevDate = new Date(previousPeriod.start);
        while (prevDate <= previousPeriod.end) {
            const day = prevDate.getDay();
            if (day !== 0 && day !== 6) {
                prevWeekdayCount++;
            }
            prevDate.setDate(prevDate.getDate() + 1);
        }
        const prevExpectedHours = prevWeekdayCount * 7;

        const oldHoursPerEmployee = new Map<string, number>();
        oldEntries.forEach((entry) => {
            const current = oldHoursPerEmployee.get(entry.userId) || 0;
            oldHoursPerEmployee.set(entry.userId, current + entry.hours);
        });

        const oldIncompleteCount = employees.filter(
            (emp) => (oldHoursPerEmployee.get(emp.id) || 0) < prevExpectedHours
        ).length;

        return NextResponse.json({
            period: {
                start: format(startDate, "yyyy-MM-dd"),
                end: format(endDate, "yyyy-MM-dd"),
                weekdays: weekdayCount,
                expectedHoursPerEmployee: expectedHours,
            },
            summary: {
                totalEmployees,
                completeEmployees,
                incompleteEmployees: totalEmployees - completeEmployees,
                completionRate,
                averageHoursPerEmployee,
                totalHoursLogged,
                oldIncompleteCount,
            },
            chargeCodeBreakdown: chargeCodeData,
            incompleteEmployeesList: incompleteEmployees,
            completeEmployeesList: completeEmployeesList,
        });
    } catch (error) {
        console.error("Error fetching admin metrics:", error);
        return NextResponse.json(
            { error: "Failed to fetch metrics" },
            { status: 500 }
        );
    }
}
