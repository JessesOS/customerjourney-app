// Every product, defined once. See docs/products/README.md for how to change one.

import { bss } from "./bss";
import { respond } from "./respond";
import { scale } from "./scale";
import type { Product } from "./types";
import { website } from "./website";

export { bss, respond, scale, website };

/** In sheet order. */
export const productList: Product[] = [scale, respond, bss, website];

export function productById(id: string): Product | null {
  return productList.find((p) => p.id === id) ?? null;
}
