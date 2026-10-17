// defineProduct: a product file's one wrapper. It returns the product as-is;
// its only job is to keep the variants' client types as literal types, so
// ClientType (products/index.ts) is the exact list of client types the product
// files define and a typo fails `tsc`.

import type { Product } from "./types";

/** `= never`: without it, a product with no variants would widen ClientType to `string`. */
export function defineProduct<const C extends string = never>(p: Product<C>): Product<C> {
  return p;
}
