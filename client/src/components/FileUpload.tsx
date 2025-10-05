import { CloudUpload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div
      className={`min-h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 p-8 transition-colors hover-elevate ${
        dragActive ? "border-primary bg-accent/50" : "border-border"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={disabled ? undefined : handleClick}
      data-testid="upload-zone"
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <CloudUpload className="w-8 h-8 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-lg font-medium mb-1">
          {disabled ? "Processing..." : "Drag video or audio file here"}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          or click to browse
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          data-testid="button-browse"
        >
          Browse Files
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Supported formats: MP4, MOV, AVI, MP3, WAV, M4A
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="video/*,audio/*"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
        data-testid="input-file"
      />
    </div>
  );
}
