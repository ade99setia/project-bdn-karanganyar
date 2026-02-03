"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, Laptop2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
    const [open, setOpen] = useState(false);
    const [theme, setTheme] = useState("system");

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") || "system";
        applyTheme(savedTheme);
    }, []);

    const applyTheme = (value: string) => {
        setTheme(value);
        localStorage.setItem("theme", value);

        if (value === "light") {
            document.documentElement.classList.remove("dark");
        } else if (value === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            // Follow system preference
            const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            if (systemDark) document.documentElement.classList.add("dark");
            else document.documentElement.classList.remove("dark");
        }
    };

    return (
        <div className="toggle-theme fixedbottom-5 right-5 z-9999">
            {/* Floating Button toggle */}
            <button
                onClick={() => setOpen(!open)}
                className="p-3 rounded-full shadow-lg border bg-background text-foreground hover:scale-105 transition"
            >
                {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Popup */}
            {open && (
                <div
                    className={cn(
                        "absolute bottom-14 right-0 rounded-xl border shadow-xl bg-background p-3 flex flex-col gap-2 min-w-35 animate-in slide-in-from-bottom-5"
                    )}
                >
                    <button
                        onClick={() => { applyTheme("light"); setOpen(false); }}
                        className={cn(
                            "flex items-center gap-2 p-2 rounded-md hover:bg-accent transition",
                            theme === "light" && "bg-accent"
                        )}
                    >
                        <Sun size={18} /> Light
                    </button>

                    <button
                        onClick={() => { applyTheme("dark"); setOpen(false); }}
                        className={cn(
                            "flex items-center gap-2 p-2 rounded-md hover:bg-accent transition",
                            theme === "dark" && "bg-accent"
                        )}
                    >
                        <Moon size={18} /> Dark
                    </button>

                    <button
                        onClick={() => { applyTheme("system"); setOpen(false); }}
                        className={cn(
                            "flex items-center gap-2 p-2 rounded-md hover:bg-accent transition",
                            theme === "system" && "bg-accent"
                        )}
                    >
                        <Laptop2 size={18} /> System
                    </button>
                </div>
            )}
        </div>
    );
}
