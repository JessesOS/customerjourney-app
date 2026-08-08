import type { ClientType } from "@/lib/journeyEngine";

/**
 * Maps a GHL product name to the portal journey it should provision.
 *
 * Checked against the live product list (102 products, RTD location,
 * 2026-08-08). Product names are free text ("Respond - VIP [ Trial & Sub ]",
 * "USD Scale - SETUP 2x Split Payments"), so matching is by product-line word,
 * not exact name.
 *
 * Deliberately unmapped, per the master plan:
 * - Convert: has a won stage and a snapshot but NO portal journey template.
 * - AISS / TradeAI / LOP / websites / add-ons: no portal journey.
 * An unmapped product is a stop, not a guess (failure mode F6) — the provision
 * endpoint fails loud to Slack and returns 422.
 */
export type MappedProduct = {
  productCode: "respond" | "scale";
  clientType: ClientType;
  // Scale products don't say which ad channels the client bought, so the
  // journey defaults to meta-google and must be confirmed by a human
  // (Decision 2). Respond has exactly one journey, so it's confirmed.
  clientTypeConfirmed: boolean;
};

export function mapProductToJourney(productName: string): MappedProduct | null {
  if (/\brespond\b/i.test(productName)) {
    return { productCode: "respond", clientType: "respond", clientTypeConfirmed: true };
  }
  if (/\bscale\b/i.test(productName)) {
    return { productCode: "scale", clientType: "meta-google", clientTypeConfirmed: false };
  }
  return null;
}
