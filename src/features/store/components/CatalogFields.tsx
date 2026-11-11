import { useRef } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/FormField";
import { StorageImage } from "@/components/ui/StorageImage";
import { useToast } from "@/components/ui/Toast";
import type { UploadPurpose } from "@/features/uploads/api/uploadApi";
import { ImageUploadButton } from "@/features/uploads/components/ImageUploadButton";

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export const positive = (value: string) => value !== "" && Number(value) > 0;

export const MAX_IMAGES = 10;

interface SizeValues {
  weight: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
}

interface SizeProps {
  values: SizeValues;
  errors: FieldErrors<keyof SizeValues> | null;
  onChange: (key: keyof SizeValues, value: string) => void;
}

export function SizeFields({ values, errors, onChange }: SizeProps) {
  const field = (key: keyof SizeValues, label: string) => (
    <Input
      label={label}
      required
      type="number"
      min={0}
      step={key === "weight" ? 1 : 0.5}
      value={values[key]}
      onChange={(e) => onChange(key, e.target.value)}
      error={errors?.[key]}
    />
  );
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {field("weight", "Khối lượng (g)")}
      {field("lengthCm", "Dài (cm)")}
      {field("widthCm", "Rộng (cm)")}
      {field("heightCm", "Cao (cm)")}
    </div>
  );
}

interface ImagesFieldProps {
  purpose: UploadPurpose;
  value: string[];
  error?: string;
  onChange: (urls: string[]) => void;
}

export function ImagesField({ purpose, value, error, onChange }: ImagesFieldProps) {
  const toast = useToast();
  const latest = useRef(value);
  latest.current = value;
  const append = (url: string) => {
    latest.current = [...latest.current, url];
    onChange(latest.current);
  };
  return (
    <div>
      <p className="mb-1 block text-sm font-medium text-ink">
        Ảnh<span className="ml-0.5 text-primary">*</span>
      </p>
      {value.length > 0 && (
        <div className="mb-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {value.map((url) => (
            <div key={url} className="relative">
              <StorageImage src={url} alt="" className="aspect-square w-full rounded-lg" />
              <button
                type="button"
                aria-label="Bỏ ảnh"
                onClick={() => onChange(value.filter((item) => item !== url))}
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-card/90 text-ink-soft shadow-card hover:text-danger"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <ImageUploadButton
          purpose={purpose}
          maxFiles={MAX_IMAGES - value.length}
          onUploaded={append}
          onError={toast.error}
        />
        <span className="text-xs text-ink-muted">
          {value.length}/{MAX_IMAGES} ảnh · JPG, PNG, WEBP tối đa 5 MB
        </span>
      </div>
      {error && <p className="mt-1 text-xs text-primary">{error}</p>}
    </div>
  );
}

export function validateSize(values: SizeValues): FieldErrors<keyof SizeValues> {
  const errors: FieldErrors<keyof SizeValues> = {};
  if (!positive(values.weight) || !Number.isInteger(Number(values.weight))) errors.weight = "Nhập số nguyên lớn hơn 0";
  if (!positive(values.lengthCm)) errors.lengthCm = "Phải lớn hơn 0";
  if (!positive(values.widthCm)) errors.widthCm = "Phải lớn hơn 0";
  if (!positive(values.heightCm)) errors.heightCm = "Phải lớn hơn 0";
  return errors;
}
