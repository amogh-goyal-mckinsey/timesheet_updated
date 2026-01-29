"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, LogOut, Settings, Cog } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
    {
        href: "/admin/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
    },
    {
        href: "/admin/manage",
        label: "Manage",
        icon: Cog,
    },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session } = useSession();
    const pathname = usePathname();

    const getUserInitials = () => {
        if (session?.user?.name) {
            return session.user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        if (session?.user?.email) {
            return session.user.email.slice(0, 2).toUpperCase();
        }
        return "A";
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200">
                {/* Logo */}
                <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
                    <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center">
                        <Settings className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900 text-lg">Admin</span>
                </div>

                {/* Navigation */}
                <nav className="px-3 py-4">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                                            isActive
                                                ? "bg-blue-50 text-blue-600"
                                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 transition-all">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-blue-600 text-white text-sm">
                                        {getUserInitials()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {session?.user?.name || "Admin"}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {session?.user?.email}
                                    </p>
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-56 bg-white border-gray-200"
                            align="end"
                        >
                            <DropdownMenuLabel className="text-gray-900">
                                Admin Account
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-gray-100" />
                            <DropdownMenuItem
                                className="text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                                onClick={() => signOut({ callbackUrl: "/login" })}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* Main content */}
            <main className="ml-64 bg-gray-50 min-h-screen">{children}</main>
        </div>
    );
}
