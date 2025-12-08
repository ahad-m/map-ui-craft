/**
 * ThemeToggle Component
 * 
 * A button that toggles between light, dark, and system theme modes.
 * Uses next-themes for theme management.
 */

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

interface ThemeToggleProps {
  variant?: "default" | "compact";
  className?: string;
}

export function ThemeToggle({ variant = "default", className = "" }: ThemeToggleProps) {
  const { setTheme, theme } = useTheme();
  const { t, i18n } = useTranslation();

  const isRTL = i18n.language === "ar";

  if (variant === "compact") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className={`h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-105 ${className}`}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 w-8 sm:h-9 sm:w-auto sm:px-3 p-0 gap-2 hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-105 ${className}`}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 sm:relative" />
          <span className="sr-only sm:not-sr-only hidden sm:inline">
            {theme === "dark" ? (isRTL ? "داكن" : "Dark") : theme === "light" ? (isRTL ? "فاتح" : "Light") : (isRTL ? "تلقائي" : "System")}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? "start" : "end"} className="min-w-[120px]">
        <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 cursor-pointer">
          <Sun className="h-4 w-4" />
          <span>{isRTL ? "فاتح" : "Light"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 cursor-pointer">
          <Moon className="h-4 w-4" />
          <span>{isRTL ? "داكن" : "Dark"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 cursor-pointer">
          <span className="h-4 w-4 flex items-center justify-center text-xs">💻</span>
          <span>{isRTL ? "تلقائي" : "System"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
