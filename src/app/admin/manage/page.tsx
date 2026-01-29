"use client";

import { useState, useEffect } from "react";
import { format, endOfMonth } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
    Users,
    FileCode2,
    Settings,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
    id: string;
    email: string;
    name: string | null;
    fmno: string;
    roles: string[];
    createdAt: string;
}

interface ChargeCode {
    id: string;
    code: string;
    description: string;
    isActive: boolean;
    _count?: {
        timeEntries: number;
    };
}

interface AdminSettings {
    id: string;
    oldestEditablePeriod: string | null;
    latestEditablePeriod: string | null;
}

// Generate period options for the last 12 months and next 6 months
function generatePeriodOptions(): { value: string; label: string }[] {
    const options: { value: string; label: string }[] = [];
    const today = new Date();

    // Go back 12 months and forward 6 months
    for (let i = -12; i <= 6; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const year = date.getFullYear();
        const month = date.getMonth();

        // First half
        const firstHalfStart = new Date(year, month, 1);
        options.push({
            value: format(firstHalfStart, "yyyy-MM-dd"),
            label: `${format(firstHalfStart, "MMMM yyyy")} (1st - 15th)`,
        });

        // Second half
        const secondHalfStart = new Date(year, month, 16);
        options.push({
            value: format(secondHalfStart, "yyyy-MM-dd"),
            label: `${format(secondHalfStart, "MMMM yyyy")} (16th - ${format(endOfMonth(date), "d")})`,
        });
    }

    return options;
}

export default function AdminManagePage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("employees");

    // Users state
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userForm, setUserForm] = useState({
        email: "",
        name: "",
        fmno: "",
        isAdmin: false,
        isEmployee: true,
    });

    // Charge codes state
    const [chargeCodes, setChargeCodes] = useState<ChargeCode[]>([]);
    const [chargeCodesLoading, setChargeCodesLoading] = useState(true);
    const [codeDialogOpen, setCodeDialogOpen] = useState(false);
    const [editingCode, setEditingCode] = useState<ChargeCode | null>(null);
    const [codeForm, setCodeForm] = useState({
        code: "",
        description: "",
        isActive: true,
    });

    // Settings state
    const [settings, setSettings] = useState<AdminSettings | null>(null);
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsForm, setSettingsForm] = useState({
        oldestEditablePeriod: "",
        latestEditablePeriod: "",
    });

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<{
        type: "user" | "code";
        id: string;
        name: string;
    } | null>(null);

    const periodOptions = generatePeriodOptions();

    // Fetch users
    useEffect(() => {
        fetchUsers();
    }, []);

    // Fetch charge codes
    useEffect(() => {
        fetchChargeCodes();
    }, []);

    // Fetch settings
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setUsersLoading(false);
        }
    };

    const fetchChargeCodes = async () => {
        try {
            const res = await fetch("/api/admin/charge-codes");
            if (res.ok) {
                const data = await res.json();
                setChargeCodes(data);
            }
        } catch (error) {
            console.error("Error fetching charge codes:", error);
        } finally {
            setChargeCodesLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/admin/settings");
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
                setSettingsForm({
                    oldestEditablePeriod: data.oldestEditablePeriod || "",
                    latestEditablePeriod: data.latestEditablePeriod || "",
                });
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setSettingsLoading(false);
        }
    };

    // User CRUD
    const handleOpenUserDialog = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setUserForm({
                email: user.email,
                name: user.name || "",
                fmno: user.fmno,
                isAdmin: user.roles.includes("ADMIN"),
                isEmployee: user.roles.includes("EMPLOYEE"),
            });
        } else {
            setEditingUser(null);
            setUserForm({
                email: "",
                name: "",
                fmno: "",
                isAdmin: false,
                isEmployee: true,
            });
        }
        setUserDialogOpen(true);
    };

    const handleSaveUser = async () => {
        const roles: string[] = [];
        if (userForm.isEmployee) roles.push("EMPLOYEE");
        if (userForm.isAdmin) roles.push("ADMIN");

        if (roles.length === 0) {
            toast({
                title: "Error",
                description: "User must have at least one role",
                variant: "destructive",
            });
            return;
        }

        try {
            const method = editingUser ? "PUT" : "POST";
            const body = editingUser
                ? { id: editingUser.id, ...userForm, roles }
                : { ...userForm, roles };

            const res = await fetch("/api/admin/users", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast({
                    title: "Success",
                    description: editingUser ? "User updated" : "User created",
                });
                setUserDialogOpen(false);
                fetchUsers();
            } else {
                const data = await res.json();
                toast({
                    title: "Error",
                    description: data.error || "Failed to save user",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error saving user:", error);
            toast({
                title: "Error",
                description: "Failed to save user",
                variant: "destructive",
            });
        }
    };

    const handleDeleteUser = async () => {
        if (!deleteConfirm || deleteConfirm.type !== "user") return;

        try {
            const res = await fetch(`/api/admin/users?id=${deleteConfirm.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast({
                    title: "Success",
                    description: "User deleted",
                });
                fetchUsers();
            } else {
                const data = await res.json();
                toast({
                    title: "Error",
                    description: data.error || "Failed to delete user",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            toast({
                title: "Error",
                description: "Failed to delete user",
                variant: "destructive",
            });
        } finally {
            setDeleteConfirm(null);
        }
    };

    // Charge Code CRUD
    const handleOpenCodeDialog = (code?: ChargeCode) => {
        if (code) {
            setEditingCode(code);
            setCodeForm({
                code: code.code,
                description: code.description,
                isActive: code.isActive,
            });
        } else {
            setEditingCode(null);
            setCodeForm({
                code: "",
                description: "",
                isActive: true,
            });
        }
        setCodeDialogOpen(true);
    };

    const handleSaveCode = async () => {
        try {
            const method = editingCode ? "PUT" : "POST";
            const body = editingCode
                ? { id: editingCode.id, ...codeForm }
                : codeForm;

            const res = await fetch("/api/admin/charge-codes", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast({
                    title: "Success",
                    description: editingCode ? "Charge code updated" : "Charge code created",
                });
                setCodeDialogOpen(false);
                fetchChargeCodes();
            } else {
                const data = await res.json();
                toast({
                    title: "Error",
                    description: data.error || "Failed to save charge code",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error saving charge code:", error);
            toast({
                title: "Error",
                description: "Failed to save charge code",
                variant: "destructive",
            });
        }
    };

    const handleDeleteCode = async () => {
        if (!deleteConfirm || deleteConfirm.type !== "code") return;

        try {
            const res = await fetch(`/api/admin/charge-codes?id=${deleteConfirm.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast({
                    title: "Success",
                    description: "Charge code deleted",
                });
                fetchChargeCodes();
            } else {
                const data = await res.json();
                toast({
                    title: "Error",
                    description: data.error || "Failed to delete charge code",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error deleting charge code:", error);
            toast({
                title: "Error",
                description: "Failed to delete charge code",
                variant: "destructive",
            });
        } finally {
            setDeleteConfirm(null);
        }
    };

    // Settings save
    const handleSaveSettings = async () => {
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    oldestEditablePeriod: settingsForm.oldestEditablePeriod || null,
                    latestEditablePeriod: settingsForm.latestEditablePeriod || null,
                }),
            });

            if (res.ok) {
                toast({
                    title: "Success",
                    description: "Settings saved",
                });
                fetchSettings();
            } else {
                toast({
                    title: "Error",
                    description: "Failed to save settings",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            toast({
                title: "Error",
                description: "Failed to save settings",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Manage</h1>
                <p className="text-gray-500 mt-1">
                    Manage employees, charge codes, and settings
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-gray-100">
                    <TabsTrigger value="employees" className="gap-2">
                        <Users className="h-4 w-4" />
                        Employees
                    </TabsTrigger>
                    <TabsTrigger value="chargecodes" className="gap-2">
                        <FileCode2 className="h-4 w-4" />
                        Charge Codes
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                    </TabsTrigger>
                </TabsList>

                {/* Employees Tab */}
                <TabsContent value="employees" className="mt-6">
                    <Card className="bg-white border-gray-200">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-gray-900">Employees</CardTitle>
                                <CardDescription>Manage employee accounts and roles</CardDescription>
                            </div>
                            <Button onClick={() => handleOpenUserDialog()} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Employee
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {usersLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>FMNO</TableHead>
                                            <TableHead>Roles</TableHead>
                                            <TableHead className="w-[100px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.name || "—"}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{user.fmno}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {user.roles.map((role) => (
                                                            <Badge
                                                                key={role}
                                                                variant={role === "ADMIN" ? "default" : "secondary"}
                                                                className={role === "ADMIN" ? "bg-purple-100 text-purple-700" : ""}
                                                            >
                                                                {role}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleOpenUserDialog(user)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => setDeleteConfirm({ type: "user", id: user.id, name: user.name || user.email })}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Charge Codes Tab */}
                <TabsContent value="chargecodes" className="mt-6">
                    <Card className="bg-white border-gray-200">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-gray-900">Charge Codes</CardTitle>
                                <CardDescription>Manage available charge codes</CardDescription>
                            </div>
                            <Button onClick={() => handleOpenCodeDialog()} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Charge Code
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {chargeCodesLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Entries</TableHead>
                                            <TableHead className="w-[100px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {chargeCodes.map((code) => (
                                            <TableRow key={code.id}>
                                                <TableCell className="font-medium font-mono">{code.code}</TableCell>
                                                <TableCell>{code.description}</TableCell>
                                                <TableCell>
                                                    <Badge variant={code.isActive ? "default" : "secondary"} className={code.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                                                        {code.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{code._count?.timeEntries || 0}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleOpenCodeDialog(code)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => setDeleteConfirm({ type: "code", id: code.id, name: code.code })}
                                                            disabled={(code._count?.timeEntries || 0) > 0}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="mt-6">
                    <Card className="bg-white border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Period Restrictions</CardTitle>
                            <CardDescription>
                                Control which periods employees can edit their timesheets
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {settingsLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Oldest Editable Period</Label>
                                            <Select
                                                value={settingsForm.oldestEditablePeriod || "none"}
                                                onValueChange={(v: string) => setSettingsForm(f => ({ ...f, oldestEditablePeriod: v === "none" ? "" : v }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="No restriction" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">No restriction</SelectItem>
                                                    {periodOptions.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-gray-500">
                                                Employees cannot edit periods before this date
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Latest Editable Period</Label>
                                            <Select
                                                value={settingsForm.latestEditablePeriod || "none"}
                                                onValueChange={(v: string) => setSettingsForm(f => ({ ...f, latestEditablePeriod: v === "none" ? "" : v }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="No restriction" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">No restriction</SelectItem>
                                                    {periodOptions.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-gray-500">
                                                Employees cannot edit periods after this date
                                            </p>
                                        </div>
                                    </div>

                                    <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
                                        Save Settings
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* User Dialog */}
            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? "Edit Employee" : "Add Employee"}</DialogTitle>
                        <DialogDescription>
                            {editingUser ? "Update employee details" : "Create a new employee account"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                value={userForm.name}
                                onChange={(e) => setUserForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={userForm.email}
                                onChange={(e) => setUserForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="john@mckinsey.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>FMNO</Label>
                            <Input
                                value={userForm.fmno}
                                onChange={(e) => setUserForm(f => ({ ...f, fmno: e.target.value.replace(/\D/g, "") }))}
                                placeholder="123456"
                            />
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <Label>Employee Role</Label>
                            <Switch
                                checked={userForm.isEmployee}
                                onCheckedChange={(v) => setUserForm(f => ({ ...f, isEmployee: v }))}
                            />
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <Label>Admin Role</Label>
                            <Switch
                                checked={userForm.isAdmin}
                                onCheckedChange={(v) => setUserForm(f => ({ ...f, isAdmin: v }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUserDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveUser} className="bg-blue-600 hover:bg-blue-700">
                            {editingUser ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Charge Code Dialog */}
            <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>{editingCode ? "Edit Charge Code" : "Add Charge Code"}</DialogTitle>
                        <DialogDescription>
                            {editingCode ? "Update charge code details" : "Create a new charge code"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Code</Label>
                            <Input
                                value={codeForm.code}
                                onChange={(e) => setCodeForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                placeholder="PROJ-001"
                                disabled={!!editingCode}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={codeForm.description}
                                onChange={(e) => setCodeForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Client Project Alpha - Development"
                            />
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <Label>Active</Label>
                            <Switch
                                checked={codeForm.isActive}
                                onCheckedChange={(v) => setCodeForm(f => ({ ...f, isActive: v }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCodeDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveCode} className="bg-blue-600 hover:bg-blue-700">
                            {editingCode ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Delete
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {deleteConfirm?.type === "user" ? "employee" : "charge code"} <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={deleteConfirm?.type === "user" ? handleDeleteUser : handleDeleteCode}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
