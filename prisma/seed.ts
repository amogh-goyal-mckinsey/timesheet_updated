import { PrismaClient, Role } from "@prisma/client";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface EmployeeRow {
    email: string;
    name: string;
    fmno: string;
}

interface AdminRow {
    email: string;
    name: string;
    fmno: string;
}

interface ChargeCodeRow {
    code: string;
    description: string;
    isActive: string;
}

function readCSV<T>(filename: string): T[] {
    const filePath = path.join(__dirname, "seed-data", filename);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Warning: ${filename} not found, skipping...`);
        return [];
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    return parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    }) as T[];
}

async function main() {
    console.log("🌱 Starting seed...");
    console.log("");

    // Read CSV files
    const employees = readCSV<EmployeeRow>("employees.csv");
    const admins = readCSV<AdminRow>("admins.csv");
    const chargeCodes = readCSV<ChargeCodeRow>("charge-codes.csv");

    // Create charge codes
    console.log("📋 Creating charge codes...");
    for (const code of chargeCodes) {
        await prisma.chargeCode.upsert({
            where: { code: code.code },
            update: {
                description: code.description,
                isActive: code.isActive.toLowerCase() === "true",
            },
            create: {
                code: code.code,
                description: code.description,
                isActive: code.isActive.toLowerCase() === "true",
            },
        });
    }
    console.log(`✅ Created/updated ${chargeCodes.length} charge codes`);
    console.log("");

    // Track all admin emails for dual-role assignment
    const adminEmails = new Set(admins.map(a => a.email.toLowerCase()));

    // Create employees
    console.log("👤 Creating employees...");
    for (const employee of employees) {
        const isAlsoAdmin = adminEmails.has(employee.email.toLowerCase());

        const roles: Role[] = isAlsoAdmin ? [Role.EMPLOYEE, Role.ADMIN] : [Role.EMPLOYEE];

        await prisma.user.upsert({
            where: { email: employee.email },
            update: {
                name: employee.name,
                fmno: employee.fmno,
                roles,
            },
            create: {
                email: employee.email,
                name: employee.name,
                fmno: employee.fmno,
                roles,
            },
        });
        console.log(`   ✅ ${employee.email} | FMNO: ${employee.fmno} | (${roles.join(", ")})`);
    }
    console.log("");

    // Create admins (who are not already employees)
    console.log("🔐 Creating admins...");
    const employeeEmails = new Set(employees.map(e => e.email.toLowerCase()));

    for (const admin of admins) {
        const isAlsoEmployee = employeeEmails.has(admin.email.toLowerCase());

        if (isAlsoEmployee) {
            // Already created as employee with dual role
            console.log(`   ⏭️ ${admin.email} (already created as employee with ADMIN role)`);
            continue;
        }

        await prisma.user.upsert({
            where: { email: admin.email },
            update: {
                name: admin.name,
                fmno: admin.fmno,
                roles: [Role.ADMIN],
            },
            create: {
                email: admin.email,
                name: admin.name,
                fmno: admin.fmno,
                roles: [Role.ADMIN],
            },
        });
        console.log(`   ✅ ${admin.email} | FMNO: ${admin.fmno} | (ADMIN)`);
    }
    console.log("");

    // Create default admin settings if not exist
    console.log("⚙️ Creating admin settings...");
    const existingSettings = await prisma.adminSettings.findFirst();
    if (!existingSettings) {
        await prisma.adminSettings.create({
            data: {
                oldestEditablePeriod: null, // No restriction by default
                latestEditablePeriod: null, // No restriction by default
            },
        });
        console.log("   ✅ Default admin settings created");
    } else {
        console.log("   ⏭️ Admin settings already exist");
    }
    console.log("");

    console.log("🎉 Seed completed successfully!");
    console.log("");
    console.log("📝 Available credentials:");
    console.log("   Employees:");
    for (const emp of employees) {
        const isAdmin = adminEmails.has(emp.email.toLowerCase());
        console.log(`   - ${emp.email} | FMNO: ${emp.fmno}${isAdmin ? " (also ADMIN)" : ""}`);
    }
    console.log("");
    console.log("   Admins (admin-only):");
    for (const admin of admins) {
        if (!employeeEmails.has(admin.email.toLowerCase())) {
            console.log(`   - ${admin.email} | FMNO: ${admin.fmno}`);
        }
    }
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
