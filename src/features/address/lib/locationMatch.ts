const UNIT_PREFIX = /^(thanh pho|tinh|tp|quan|huyen|thi xa|thi tran|phuong|xa)\s+/;
const NUMBER = /^\d+$/;

export const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

export const coreName = (folded: string) => folded.replace(UNIT_PREFIX, "").replace(/^0+(?=\d)/, "");

export function findLocation<T extends { name: string }>(items: T[], name: string): T | undefined {
  const target = fold(name).trim();
  if (!target) return undefined;

  const core = coreName(target);
  const exact = items.find((item) => fold(item.name) === target) ?? items.find((item) => coreName(fold(item.name)) === core);
  if (exact || NUMBER.test(core)) return exact;

  return items.find((item) => {
    const candidate = coreName(fold(item.name));
    return !NUMBER.test(candidate) && (candidate.includes(core) || core.includes(candidate));
  });
}
