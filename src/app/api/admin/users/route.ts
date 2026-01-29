import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

// GET: Fetch all users
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || !session.user.roles.includes("ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                fmno: true,
                roles: true,
                createdAt: true,
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

// POST: Create a new user
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !session.user.roles.includes("ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { email, name, fmno, roles } = body;

        if (!email || !fmno) {
            return NextResponse.json(
                { error: "Email and FMNO are required" },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { fmno },
                ],
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email or FMNO already exists" },
                { status: 400 }
            );
        }

        const user = await prisma.user.create({
            data: {
                email,
                name: name || null,
                fmno,
                roles: roles || [Role.EMPLOYEE],
            },
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        );
    }
}

// PUT: Update a user
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !session.user.roles.includes("ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, email, name, fmno, roles } = body;

        if (!id) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.update({
            where: { id },
            data: {
                email,
                name,
                fmno,
                roles,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}

// DELETE: Delete a user
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
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // Don't allow deleting yourself
        if (id === session.user.id) {
            return NextResponse.json(
                { error: "Cannot delete your own account" },
                { status: 400 }
            );
        }

        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
        );
    }
}
