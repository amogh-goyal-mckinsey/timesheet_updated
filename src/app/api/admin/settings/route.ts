import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: Fetch admin settings
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || !session.user.roles.includes("ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let settings = await prisma.adminSettings.findFirst();

        // Create default settings if none exist
        if (!settings) {
            settings = await prisma.adminSettings.create({
                data: {
                    oldestEditablePeriod: null,
                    latestEditablePeriod: null,
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching admin settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}

// PUT: Update admin settings
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !session.user.roles.includes("ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { oldestEditablePeriod, latestEditablePeriod } = body;

        let settings = await prisma.adminSettings.findFirst();

        if (!settings) {
            settings = await prisma.adminSettings.create({
                data: {
                    oldestEditablePeriod: oldestEditablePeriod ? new Date(oldestEditablePeriod) : null,
                    latestEditablePeriod: latestEditablePeriod ? new Date(latestEditablePeriod) : null,
                },
            });
        } else {
            settings = await prisma.adminSettings.update({
                where: { id: settings.id },
                data: {
                    oldestEditablePeriod: oldestEditablePeriod ? new Date(oldestEditablePeriod) : null,
                    latestEditablePeriod: latestEditablePeriod ? new Date(latestEditablePeriod) : null,
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error updating admin settings:", error);
        return NextResponse.json(
            { error: "Failed to update settings" },
            { status: 500 }
        );
    }
}
