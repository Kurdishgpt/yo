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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          {language && (
            <span className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
              {language}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            data-testid="button-copy"
          >
            <Copy className="w-4 h-4" />
          </Button>
          {onDownload && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDownload}
              data-testid="button-download"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={`max-h-96 overflow-y-auto p-4 rounded-md bg-muted text-sm ${
            isMonospace ? "font-mono" : ""
          }`}
        >
          <pre className="whitespace-pre-wrap break-words">{content}</pre>
        </div>
      </CardContent>
    </Card>
  );
}
