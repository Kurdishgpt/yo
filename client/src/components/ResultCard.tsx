import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResultCardProps {
  title: string;
  content: string;
  icon?: React.ReactNode;
  language?: string;
  isMonospace?: boolean;
  onDownload?: () => void;
}

export function ResultCard({
  title,
  content,
  icon,
  language,
  isMonospace,
  onDownload,
}: ResultCardProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      duration: 2000,
    });
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {language && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
              {language}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            data-testid="button-copy"
            className="hover:scale-110 transition-transform"
          >
            <Copy className="w-4 h-4" />
          </Button>
          {onDownload && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDownload}
              data-testid="button-download"
              className="hover:scale-110 transition-transform"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={`max-h-96 overflow-y-auto p-5 rounded-lg bg-muted/50 text-sm border border-border/50 ${
            isMonospace ? "font-mono" : ""
          }`}
        >
          <pre className="whitespace-pre-wrap break-words leading-relaxed">{content}</pre>
        </div>
      </CardContent>
    </Card>
  );
}
