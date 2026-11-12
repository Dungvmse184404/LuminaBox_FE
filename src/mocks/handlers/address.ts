import type { Address, AddressPayload } from "@/features/address/types";
import { mockScenario } from "@/mocks/scenario";
import { mock, mockError, newId } from "@/mocks/server";

const LOCATION = {
  provinceId: "79",
  provinceName: "TP. Hồ Chí Minh",
  districtId: "760",
  districtName: "Quận 1",
  wardName: "Phường Bến Nghé",
};

const SAMPLE: Address[] = [
  {
    id: newId(),
    type: "Shipping",
    contactName: "Demo User",
    phone: "0901234567",
    ...LOCATION,
    wardId: "26734",
    addressLine: "12 Lê Lợi",
    isDefault: true,
    latitude: 10.7769,
    longitude: 106.7009,
  },
  {
    id: newId(),
    type: "Pickup",
    contactName: "Demo Organizer",
    phone: "0907654321",
    ...LOCATION,
    wardId: "26734",
    addressLine: "88 Nam Kỳ Khởi Nghĩa",
    isDefault: true,
    latitude: 10.7797,
    longitude: 106.6897,
  },
];

const addresses: Address[] = mockScenario() === "no-addresses" ? [] : [...SAMPLE];

const find = (id: string) => {
  const address = addresses.find((a) => a.id === id);
  if (!address) throw mockError(404, "Không tìm thấy địa chỉ.");
  return address;
};

const makeDefault = (address: Address) => {
  addresses.filter((a) => a.type === address.type).forEach((a) => (a.isDefault = a.id === address.id));
};

mock("GET", "/addresses/me", ({ query }) => addresses.filter((a) => a.type === (query.get("type") ?? "Shipping")));

mock(
  "POST",
  "/addresses",
  ({ body }) => {
    const payload = body as AddressPayload;
    const first = !addresses.some((a) => a.type === payload.type);
    const created: Address = { id: newId(), ...LOCATION, ...payload, isDefault: payload.isDefault || first };
    addresses.push(created);
    if (created.isDefault) makeDefault(created);
    return created;
  },
  "Đã thêm địa chỉ.",
);

mock("PUT", "/addresses/:id/default", ({ params }) => {
  makeDefault(find(params.id));
  return null;
});

mock("PUT", "/addresses/:id", ({ params, body }) => {
  const address = find(params.id);
  Object.assign(address, body as AddressPayload);
  if (address.isDefault) makeDefault(address);
  return address;
});

mock("DELETE", "/addresses/:id", ({ params }) => {
  const index = addresses.findIndex((a) => a.id === params.id);
  if (index < 0) throw mockError(404, "Không tìm thấy địa chỉ.");
  addresses.splice(index, 1);
  return null;
});
