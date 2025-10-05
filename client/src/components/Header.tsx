import { Languages } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  return (
    <header className="h-16 border-b flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
          <Languages className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Kurdish Dubbing</h1>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
