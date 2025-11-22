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
      className={`min-h-72 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-6 p-12 transition-all duration-300 shadow-lg hover:shadow-xl ${
        dragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-border bg-card"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={disabled ? undefined : handleClick}
      data-testid="upload-zone"
    >
      <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
        dragActive ? "bg-primary/20 scale-110" : "bg-primary/10"
      }`}>
        <CloudUpload className={`w-10 h-10 text-primary transition-transform duration-300 ${
          dragActive ? "scale-110" : ""
        }`} />
      </div>
      <div className="text-center">
        <p className="text-xl font-semibold mb-2">
          {disabled ? "Processing..." : "Drop your file here"}
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          or click to browse from your device
        </p>
        <Button
          variant="outline"
          size="lg"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          data-testid="button-browse"
          className="hover:scale-105 transition-transform"
        >
          <CloudUpload className="w-4 h-4 mr-2" />
          Browse Files
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="px-3 py-1 rounded-full bg-muted">MP4</span>
        <span className="px-3 py-1 rounded-full bg-muted">MOV</span>
        <span className="px-3 py-1 rounded-full bg-muted">AVI</span>
        <span className="px-3 py-1 rounded-full bg-muted">MP3</span>
        <span className="px-3 py-1 rounded-full bg-muted">WAV</span>
        <span className="px-3 py-1 rounded-full bg-muted">M4A</span>
      </div>
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
