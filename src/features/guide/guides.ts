import { findNavNode, type NavNode } from "./navigationMap";

export const GUIDE_TARGETS = {
  add_address: "address-book-add",
  update_personal_info: "profile-personal-info",
  change_password: "profile-change-password",
  update_shop_profile: "profile-shop-profile",
  add_pickup_address: "pickup-address-add",
} as const;

export type GuideId = keyof typeof GUIDE_TARGETS;

export function isGuideId(value: string): value is GuideId {
  return Object.prototype.hasOwnProperty.call(GUIDE_TARGETS, value);
}

export function guideTarget(id: string): NavNode | undefined {
  return isGuideId(id) ? findNavNode(GUIDE_TARGETS[id]) : undefined;
}
