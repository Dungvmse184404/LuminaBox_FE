import { useState, type ImgHTMLAttributes } from "react";
import { ImageOff } from "lucide-react";
import { imageSrc } from "@/lib/storage";
import { cn } from "@/lib/cn";

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string | null | undefined;
}

export function StorageImage({ src, alt = "", className, ...rest }: Props) {
  const [failed, setFailed] = useState(false);
  const url = imageSrc(src);

  if (!url || failed) {
    return (
      <div className={cn("grid place-items-center bg-cream-dark text-ink-muted", className)}>
        <ImageOff size={24} />
      </div>
    );
  }

  return <img src={url} alt={alt} loading="lazy" onError={() => setFailed(true)} className={cn("object-cover", className)} {...rest} />;
}
