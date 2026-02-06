import { useState, useRef } from "react";
import { Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  value: string | null;
  onChange: (file: File | null, preview: string | null) => void;
  error?: string;
}

const AvatarUpload = ({ value, onChange, error }: AvatarUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(file, e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative w-28 h-28 rounded-full border-2 border-dashed cursor-pointer transition-all duration-200",
          "flex items-center justify-center overflow-hidden",
          isDragging ? "border-gold bg-gold/10" : "border-border hover:border-gold/50",
          error && "border-destructive"
        )}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-0 right-0 p-1.5 bg-destructive rounded-full text-white shadow-md"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Camera className="w-8 h-8" />
            <span className="text-xs">Photo *</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {error && (
        <p className="text-destructive text-xs text-center">{error}</p>
      )}
    </div>
  );
};

export default AvatarUpload;
