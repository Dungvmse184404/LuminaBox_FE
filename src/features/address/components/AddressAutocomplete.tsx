import { forwardRef } from "react";
import { Autocomplete, type AutocompleteProps } from "@/components/ui/Autocomplete";
import { coreName } from "../lib/locationMatch";

export type { AutocompleteOption } from "@/components/ui/Autocomplete";

const stripCityPrefix = (folded: string) => folded.replace(/^tp\.?\s*/, "");

export const AddressAutocomplete = forwardRef<HTMLInputElement, AutocompleteProps>(function AddressAutocomplete(props, ref) {
  return <Autocomplete ref={ref} coreName={coreName} normalizeQuery={stripCityPrefix} {...props} />;
});
