import { lazy, Suspense, useEffect, useRef, useState, type FocusEvent, type RefObject } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { CONTROL } from "@/components/ui/FormField";
import { cn } from "@/lib/cn";
import { vietmapApi, type Place } from "../api/vietmapApi";
import { locationQueries, useDistricts, useProvinces, useWards } from "../hooks/useAddresses";
import { findLocation } from "../lib/locationMatch";
import { AddressAutocomplete, type AutocompleteOption } from "./AddressAutocomplete";
import type { MapFocus } from "./AddressMap";

const AddressMap = lazy(() => import("./AddressMap").then((module) => ({ default: module.AddressMap })));

export interface AddressValue {
  provinceId: string;
  districtId: string;
  wardId: string;
  addressLine: string;
  latitude: number | null;
  longitude: number | null;
}

export const EMPTY_ADDRESS: AddressValue = { provinceId: "", districtId: "", wardId: "", addressLine: "", latitude: null, longitude: null };

export interface AddressErrors {
  ward?: string;
  addressLine?: string;
}

export function validateAddress(value: AddressValue): AddressErrors | null {
  const errors: AddressErrors = {};
  if (!value.wardId) errors.ward = "Vui lòng chọn đủ tỉnh, quận, phường";
  if (!value.addressLine.trim()) errors.addressLine = "Vui lòng nhập số nhà, tên đường";
  else if (value.addressLine.trim().length > 255) errors.addressLine = "Tối đa 255 ký tự";
  return errors.ward || errors.addressLine ? errors : null;
}

interface Props {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  errors?: AddressErrors | null;
  required?: boolean;
  withMap?: boolean;
}

const SEARCH_DELAY = 350;
const MIN_SEARCH_LENGTH = 3;
const PROVINCE_ZOOM = 11;
const DISTRICT_ZOOM = 13;
const WARD_ZOOM = 15;
const STREET_ZOOM = 16;
const nameOf = (items: AutocompleteOption[] | undefined, id: string) => items?.find((item) => item.id === id)?.name ?? "";
const focusOn = (ref: RefObject<HTMLInputElement | null>) => requestAnimationFrame(() => ref.current?.focus());

export function AddressFields({ value, onChange, errors, required = true, withMap = true }: Props) {
  const queryClient = useQueryClient();
  const provinces = useProvinces();
  const districts = useDistricts(value.provinceId);
  const wards = useWards(value.districtId);

  const [places, setPlaces] = useState<Place[]>([]);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState("");
  const [mapFocus, setMapFocus] = useState<MapFocus | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const districtRef = useRef<HTMLInputElement>(null);
  const wardRef = useRef<HTMLInputElement>(null);
  const streetRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const searchTimer = useRef(0);
  const searchRun = useRef(0);
  const locateRun = useRef(0);
  const flyRun = useRef(0);
  const openedOnArea = useRef(false);

  const provinceName = nameOf(provinces.data, value.provinceId);
  const districtName = nameOf(districts.data, value.districtId);
  const wardName = nameOf(wards.data, value.wardId);
  const complete = Boolean(wardName && value.addressLine.trim());
  const folded = collapsed && complete;
  const fullAddress = [value.addressLine.trim(), wardName, districtName, provinceName].join(", ");

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    const movedToOtherField = next instanceof Element && next.matches("input, textarea, select") && !next.closest("[data-address-fields]");
    if (movedToOtherField && complete) setCollapsed(true);
  };

  const expand = () => {
    setCollapsed(false);
    focusOn(streetRef);
  };

  const flyTo = async (text: string, zoom: number) => {
    if (!withMap || !vietmapApi.enabled) return;
    const run = ++flyRun.current;
    const position = await vietmapApi.locate(`${text}, Việt Nam`);
    if (position && run === flyRun.current) setMapFocus({ ...position, zoom });
  };

  useEffect(() => {
    if (openedOnArea.current || !wardName || !districtName || !provinceName) return;
    openedOnArea.current = true;
    if (value.latitude === null) void flyTo(`${wardName}, ${districtName}, ${provinceName}`, WARD_ZOOM);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wardName, districtName, provinceName]);

  const change = (area: Partial<AddressValue>) => {
    setNotice("");
    onChange({ ...valueRef.current, ...area, latitude: null, longitude: null });
  };

  const pickProvince = (option: AutocompleteOption | null, advance: boolean) => {
    if (option?.id !== value.provinceId) change({ provinceId: option?.id ?? "", districtId: "", wardId: "" });
    if (advance) focusOn(districtRef);
    if (option) void flyTo(option.name, PROVINCE_ZOOM);
  };

  const pickDistrict = (option: AutocompleteOption | null, advance: boolean) => {
    if (option?.id !== value.districtId) change({ districtId: option?.id ?? "", wardId: "" });
    if (advance) focusOn(wardRef);
    if (option) void flyTo(`${option.name}, ${provinceName}`, DISTRICT_ZOOM);
  };

  const pickWard = (option: AutocompleteOption | null, advance: boolean) => {
    if (option?.id !== value.wardId) change({ wardId: option?.id ?? "" });
    if (advance) focusOn(streetRef);
    if (option) void flyTo(`${option.name}, ${districtName}, ${provinceName}`, WARD_ZOOM);
  };

  const resolveArea = async (place: Pick<Place, "province" | "district" | "ward">) => {
    const provinceList = await queryClient.fetchQuery(locationQueries.provinces());
    const province = findLocation(provinceList, place.province);
    if (!province) return null;

    const districtList = await queryClient.fetchQuery(locationQueries.districts(province.id));
    const district = findLocation(districtList, place.district);
    if (!district) return { provinceId: province.id, districtId: "", wardId: "" };

    const wardList = await queryClient.fetchQuery(locationQueries.wards(district.id));
    return { provinceId: province.id, districtId: district.id, wardId: findLocation(wardList, place.ward)?.id ?? "" };
  };

  const applyArea = (area: Awaited<ReturnType<typeof resolveArea>>) => {
    setNotice(area?.wardId ? "" : "Chưa xác định đủ khu vực, bạn chọn tay phần còn thiếu nhé.");
    return area ?? {};
  };

  const onStreetText = (text: string) => {
    onChange({ ...valueRef.current, addressLine: text });
    window.clearTimeout(searchTimer.current);
    const run = ++searchRun.current;
    if (!vietmapApi.enabled || text.trim().length < MIN_SEARCH_LENGTH) return setPlaces([]);

    searchTimer.current = window.setTimeout(async () => {
      const area = [wardName, districtName, provinceName].filter(Boolean).join(", ");
      const found = await vietmapApi.streets(area ? `${text}, ${area}` : text);
      if (run === searchRun.current) setPlaces(found);
    }, SEARCH_DELAY);
  };

  const pickPlace = async (option: AutocompleteOption | null) => {
    const place = places.find((item) => item.id === option?.id);
    if (!place) return;

    window.clearTimeout(searchTimer.current);
    searchRun.current += 1;
    setPlaces([]);
    onChange({ ...valueRef.current, addressLine: place.name });

    const run = ++locateRun.current;
    setLocating(true);
    const [area, position] = await Promise.all([resolveArea(place), vietmapApi.coordinates(place.id)]);
    if (run !== locateRun.current) return;

    setLocating(false);
    onChange({ ...valueRef.current, ...applyArea(area), latitude: position?.lat ?? null, longitude: position?.lng ?? null });
    if (position) setMapFocus({ ...position, zoom: STREET_ZOOM });
  };

  const pickOnMap = async (lat: number, lng: number) => {
    const run = ++locateRun.current;
    onChange({ ...valueRef.current, latitude: lat, longitude: lng });
    if (!vietmapApi.enabled) return;

    setLocating(true);
    const place = await vietmapApi.reverse(lat, lng);
    const area = place ? await resolveArea(place) : null;
    if (run !== locateRun.current) return;

    setLocating(false);
    onChange({ ...valueRef.current, ...applyArea(area), addressLine: place?.name || valueRef.current.addressLine });
  };

  return (
    <div data-address-fields="" onBlur={onBlur}>
      {folded && (
        <button type="button" title={fullAddress} onClick={expand} className={cn(CONTROL, "flex items-center gap-2 border-line text-left")}>
          <MapPin size={16} className="shrink-0 text-primary" />
          <span className="truncate">{fullAddress}</span>
        </button>
      )}

      <div className={folded ? "hidden" : "space-y-3"}>
      <div className="grid gap-3 sm:grid-cols-2">
        <AddressAutocomplete
          label="Tỉnh / thành"
          required={required}
          options={provinces.data ?? []}
          loading={provinces.isLoading}
          text={provinceName}
          onPick={pickProvince}
        />
        <AddressAutocomplete
          ref={districtRef}
          label="Quận / huyện"
          placeholder={value.provinceId ? undefined : "Chọn tỉnh trước"}
          required={required}
          disabled={!value.provinceId}
          options={districts.data ?? []}
          loading={districts.isLoading}
          text={districtName}
          onPick={pickDistrict}
        />
        <AddressAutocomplete
          ref={wardRef}
          label="Phường / xã"
          placeholder={value.districtId ? undefined : "Chọn quận trước"}
          required={required}
          disabled={!value.districtId}
          options={wards.data ?? []}
          loading={wards.isLoading}
          text={wardName}
          error={errors?.ward}
          onPick={pickWard}
        />
        <AddressAutocomplete
          ref={streetRef}
          freeText
          label="Số nhà, tên đường"
          required={required}
          options={places.map(({ id, name, hint }) => ({ id, name, hint }))}
          text={value.addressLine}
          error={errors?.addressLine}
          onTextChange={onStreetText}
          onPick={pickPlace}
        />
      </div>

      {(locating || notice) && <p className="text-xs text-ink-soft">{locating ? "Đang xác định địa chỉ..." : notice}</p>}

      {withMap && (
        <div>
          <p className="mb-1 text-sm font-medium text-ink">Vị trí trên bản đồ</p>
          <Suspense fallback={<div className="h-72 animate-pulse rounded-xl bg-cream" />}>
            <AddressMap latitude={value.latitude} longitude={value.longitude} focus={mapFocus} onPick={pickOnMap} />
          </Suspense>
        </div>
      )}
      </div>
    </div>
  );
}
