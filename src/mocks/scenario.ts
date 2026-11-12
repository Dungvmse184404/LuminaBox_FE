export const MOCK_SCENARIO_KEY = "luminabox.mock.scenario";

export interface MockScenario {
  id: string;
  label: string;
  routes: string[];
}

export const MOCK_SCENARIOS: MockScenario[] = [
  { id: "no-addresses", label: "Chưa có địa chỉ", routes: ["/account/profile", "/account/addresses", "/store/pickup-addresses"] },
];

export function mockScenario(): string | null {
  try {
    return localStorage.getItem(MOCK_SCENARIO_KEY);
  } catch {
    return null;
  }
}
