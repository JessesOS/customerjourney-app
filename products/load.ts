// Finding a product for a client type. The pure helpers live in
// ./helpers.ts and are re-exported here, so existing imports keep working.
// The app reads products through lib/productRegistry.ts.

import { productList } from "./index";
import type { PortalOverrides, Product, ProductVariant } from "./types";

export * from "./helpers";

/** The product a client type runs on (any status), or null when none defines it. */
export function productForClientType(clientType: string): Product | null {
  return (productList as readonly Product[]).find((p) => p.variants.some((v) => v.clientType === clientType)) ?? null;
}

/** A product by its id, or null. */
export function productById(id: string): Product | null {
  return (productList as readonly Product[]).find((p) => p.id === id) ?? null;
}

/** The product's variant for a client type. Throws if the product has none. */
export function variantFor(product: Product, clientType: string): ProductVariant {
  const variant = product.variants.find((v) => v.clientType === clientType);
  if (!variant) throw new Error(`Product "${product.id}" has no variant for client type "${clientType}"`);
  return variant;
}

/** The portal tweaks for a client type (BSS Launchpad name, hidden videos, notes...). */
export function portalOverrides(product: Product, clientType: string): PortalOverrides {
  return variantFor(product, clientType).portal;
}
