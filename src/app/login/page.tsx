"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from "@/components/ui/card";
import { LoginType } from "@/types";
import { Clock, Users, Shield } from "lucide-react";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl");
    const error = searchParams.get("error");

    const [email, setEmail] = useState("");
    const [fmno, setFmno] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<LoginType>("employee");
    const [loginError, setLoginError] = useState<string | null>(
        error ? "Invalid credentials" : null
    );

    const handleLogin = async () => {
        setIsLoading(true);
        setLoginError(null);

        try {
            const result = await signIn("credentials", {
                email,
                fmno,
                loginType: activeTab,
                redirect: false,
            });

            if (result?.error) {
                if (result.error.includes("Admin role required")) {
                    setLoginError("Access denied: You don't have admin privileges");
                } else {
                    setLoginError("Invalid email or FMNO");
                }
                setIsLoading(false);
                return;
            }

            // Redirect based on login type
            if (activeTab === "admin") {
                router.push(callbackUrl || "/admin/dashboard");
            } else {
                router.push(callbackUrl || "/timesheet");
            }
        } catch {
            setLoginError("An unexpected error occurred");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-600 mb-4">
                        <Clock className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900">Timesheet</h1>
                    <p className="text-gray-500 mt-1">Track your work hours</p>
                </div>

                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="pb-4">
                        {/* Tab Selector */}
                        <div className="flex rounded-lg bg-gray-100 p-1">
                            <button
                                onClick={() => setActiveTab("employee")}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${activeTab === "employee"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                <Users className="h-4 w-4" />
                                Employee
                            </button>
                            <button
                                onClick={() => setActiveTab("admin")}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${activeTab === "admin"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                <Shield className="h-4 w-4" />
                                Admin
                            </button>
                        </div>
                        <CardDescription className="text-center mt-4 text-gray-500">
                            {activeTab === "employee"
                                ? "Access your timesheet and log hours"
                                : "Access admin dashboard and reports"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loginError && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm text-center">
                                {loginError}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-700">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your_name@mckinsey.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fmno" className="text-gray-700">
                                FMNO
                            </Label>
                            <Input
                                id="fmno"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="123456"
                                value={fmno}
                                onChange={(e) => setFmno(e.target.value.replace(/\D/g, ""))}
                                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                disabled={isLoading}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && email && fmno) {
                                        handleLogin();
                                    }
                                }}
                            />
                        </div>

                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-5"
                            onClick={handleLogin}
                            disabled={isLoading || !email || !fmno}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <svg
                                        className="animate-spin h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Signing in...
                                </div>
                            ) : (
                                `Sign in as ${activeTab === "admin" ? "Admin" : "Employee"}`
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-gray-400 mt-6">
                    © 2026 Timesheet System
                </p>
            </div>
        </div>
    );
}

function LoginFallback() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFallback />}>
            <LoginForm />
        </Suspense>
    );
}
