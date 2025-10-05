import { CheckCircle, Clock, Loader2 } from "lucide-react";

interface ProcessingStep {
  id: string;
  label: string;
  status: "pending" | "processing" | "completed";
}

interface ProcessingStatusProps {
  steps: ProcessingStep[];
  currentProgress?: number;
}

export function ProcessingStatus({ steps, currentProgress }: ProcessingStatusProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex-1 flex flex-col items-center gap-2">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                step.status === "completed"
                  ? "bg-primary border-primary"
                  : step.status === "processing"
                  ? "bg-primary/10 border-primary"
                  : "bg-background border-border"
              }`}
            >
              {step.status === "completed" ? (
                <CheckCircle className="w-6 h-6 text-primary-foreground" />
              ) : step.status === "processing" ? (
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              ) : (
                <Clock className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <p
              className={`text-sm font-medium text-center ${
                step.status === "processing"
                  ? "text-foreground"
                  : step.status === "completed"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </p>
            {index < steps.length - 1 && (
              <div className="absolute left-1/2 top-6 w-full h-0.5 -z-10 hidden md:block">
                <div
                  className={`h-full transition-colors ${
                    step.status === "completed" ? "bg-primary" : "bg-border"
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {currentProgress !== undefined && (
        <div className="space-y-2">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
          <p className="text-sm text-center text-muted-foreground">
            {currentProgress}% complete
          </p>
        </div>
      )}
    </div>
  );
}
