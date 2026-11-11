import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { UploadPurpose } from "../api/uploadApi";
import { checkImageFile, uploadError, useUploadImage } from "../hooks/useUpload";

interface Props {
  purpose: UploadPurpose;
  maxFiles: number;
  label?: string;
  disabled?: boolean;
  onUploaded: (url: string) => void | Promise<void>;
  onError: (message: string) => void;
}

export function ImageUploadButton({ purpose, maxFiles, label = "Chọn ảnh", disabled, onUploaded, onError }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadImage(purpose);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const pick = async (files: FileList | null) => {
    const list = Array.from(files ?? []).slice(0, Math.max(maxFiles, 0));
    if (input.current) input.current.value = "";
    if (list.length === 0) return;

    setProgress({ done: 0, total: list.length });
    for (const [index, file] of list.entries()) {
      const problem = checkImageFile(file);
      if (problem) {
        onError(problem);
      } else {
        try {
          await onUploaded(await upload.mutateAsync(file));
        } catch (error) {
          onError(uploadError(error));
        }
      }
      setProgress({ done: index + 1, total: list.length });
    }
    setProgress(null);
  };

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={maxFiles > 1}
        hidden
        onChange={(e) => void pick(e.target.files)}
      />
      <Button variant="outline" size="sm" disabled={disabled || maxFiles <= 0} loading={progress !== null} onClick={() => input.current?.click()}>
        {progress === null && <ImagePlus size={14} />}
        {progress ? `Đang tải ${progress.done}/${progress.total}` : label}
      </Button>
    </>
  );
}
