import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: Fetch all charge codes (for admin management)
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || !session.user.roles.includes("ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const chargeCodes = await prisma.chargeCode.findMany({
            orderBy: { code: "asc" },
            include: {
                _count: {
                    select: { timeEntries: true },
                },
            },
        });

        return NextResponse.json(chargeCodes);
    } catch (error) {
        console.error("Error fetching charge codes:", error);
        return NextResponse.json(
            { error: "Failed to fetch charge codes" },
            { status: 500 }
        );
    }
}

// POST: Create a new charge code
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !session.user.roles.includes("ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { code, description, isActive } = body;

        if (!code || !description) {
            return NextResponse.json(
                { error: "Code and description are required" },
                { status: 400 }
            );
        }

        // Check if code already exists
        const existing = await prisma.chargeCode.findUnique({
            where: { code },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Charge code already exists" },
                { status: 400 }
            );
        }

        const chargeCode = await prisma.chargeCode.create({
            data: {
                code,
                description,
                isActive: isActive ?? true,
            },
        });

        return NextResponse.json(chargeCode, { status: 201 });
    } catch (error) {
        console.error("Error creating charge code:", error);
        return NextResponse.json(
            { error: "Failed to create charge code" },
            { status: 500 }
        );
    }
}

// PUT: Update a charge code
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !session.user.roles.includes("ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, code, description, isActive } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Charge code ID is required" },
                { status: 400 }
            );
        }

        const chargeCode = await prisma.chargeCode.update({
            where: { id },
            data: {
                code,
                description,
                isActive,
            },
        });

        return NextResponse.json(chargeCode);
    } catch (error) {
        console.error("Error updating charge code:", error);
        return NextResponse.json(
            { error: "Failed to update charge code" },
            { status: 500 }
        );
    }
}

// DELETE: Delete a charge code
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !session.user.roles.includes("ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Charge code ID is required" },
                { status: 400 }
            );
        }

        // Check if charge code has time entries
        const chargeCode = await prisma.chargeCode.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { timeEntries: true },
                },
            },
        });

        if (chargeCode && chargeCode._count.timeEntries > 0) {
            return NextResponse.json(
                {
                    error: "Cannot delete charge code with existing time entries",
                    entriesCount: chargeCode._count.timeEntries,
                },
                { status: 400 }
            );
        }

        await prisma.chargeCode.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting charge code:", error);
        return NextResponse.json(
            { error: "Failed to delete charge code" },
            { status: 500 }
        );
    }
}
