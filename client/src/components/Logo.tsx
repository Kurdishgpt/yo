import { Mic2, Languages } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-3" data-testid="logo">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        <div className="relative w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
          <Mic2 className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-foreground leading-tight">
          Kurdish<span className="text-primary">Dub</span>
        </h1>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Languages className="w-3 h-3" />
          AI Dubbing
        </p>
      </div>
    </div>
  );
}
