"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface HourPickerProps {
    value: number | null;
    onChange: (hours: number | null) => void;
    disabled?: boolean;
    className?: string;
    maxHours?: number;
    isWeekend?: boolean;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7] as const;

export function HourPicker({
    value,
    onChange,
    disabled = false,
    className,
    maxHours = 7,
    isWeekend = false,
}: HourPickerProps) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync input value when popover opens
    useEffect(() => {
        if (open && inputRef.current) {
            setInputValue(value !== null && value !== undefined ? value.toString() : "");
            // Focus the input after a short delay
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open, value]);

    const handleSelect = (hours: number) => {
        onChange(hours);
        setOpen(false);
    };

    const handleClear = () => {
        onChange(null);
        setOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, "");
        setInputValue(val);

        // Auto-apply if valid
        const numVal = parseInt(val, 10);
        if (numVal >= 1 && numVal <= 7 && numVal <= maxHours) {
            onChange(numVal);
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            const numVal = parseInt(inputValue, 10);
            if (numVal >= 1 && numVal <= 7 && numVal <= maxHours) {
                onChange(numVal);
                setOpen(false);
            } else if (inputValue === "" || inputValue === "0") {
                onChange(null);
                setOpen(false);
            }
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    const getDisplayValue = () => {
        if (value === null || value === undefined) return "—";
        return value.toString();
    };

    const getButtonStyle = () => {
        if (isWeekend) {
            return "text-gray-300 bg-gray-100 cursor-not-allowed";
        }
        if (value === null || value === undefined) {
            return "text-gray-400 hover:text-gray-600 hover:bg-gray-100";
        }
        // All values show as blue (per user request - no red/orange for 4-6)
        if (value === 7) {
            return "text-green-600 bg-green-50 hover:bg-green-100";
        }
        return "text-blue-600 bg-blue-50 hover:bg-blue-100";
    };

    const isHourDisabled = (hour: number) => {
        return hour > maxHours;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    disabled={disabled || isWeekend}
                    className={cn(
                        "h-10 w-14 text-lg font-medium transition-all duration-200",
                        getButtonStyle(),
                        disabled && "opacity-50 cursor-not-allowed",
                        className
                    )}
                >
                    {getDisplayValue()}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-2 bg-white border-gray-200 shadow-lg"
                align="center"
                sideOffset={4}
            >
                {/* Type input */}
                <div className="mb-2">
                    <Input
                        ref={inputRef}
                        type="text"
                        inputMode="numeric"
                        placeholder="Type 1-7"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        className="h-9 text-center text-sm border-gray-200"
                        maxLength={1}
                    />
                </div>

                {/* Button grid */}
                <div className="grid grid-cols-4 gap-1">
                    {HOURS.map((hour) => {
                        const hourDisabled = isHourDisabled(hour);
                        return (
                            <Button
                                key={hour}
                                size="sm"
                                variant={value === hour ? "default" : "outline"}
                                disabled={hourDisabled}
                                className={cn(
                                    "h-9 w-9 text-sm font-medium",
                                    value === hour
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : hourDisabled
                                            ? "bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed"
                                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                )}
                                onClick={() => !hourDisabled && handleSelect(hour)}
                                title={hourDisabled ? `Cannot exceed 7 hours per day` : `${hour} hour${hour > 1 ? 's' : ''}`}
                            >
                                {hour}
                            </Button>
                        );
                    })}
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-9 w-9 text-sm font-medium bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700"
                        onClick={handleClear}
                        title="Clear hours"
                    >
                        ✕
                    </Button>
                </div>
                {maxHours < 7 && (
                    <p className="text-xs text-orange-500 text-center mt-2">
                        Max {maxHours}h remaining for this day
                    </p>
                )}
                {maxHours >= 7 && (
                    <p className="text-xs text-gray-400 text-center mt-2">
                        Type or click to select hours (1-7)
                    </p>
                )}
            </PopoverContent>
        </Popover>
    );
}
