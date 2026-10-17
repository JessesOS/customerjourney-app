/**
 * Every voice clip the portal plays, with its text, from the product files:
 * each product's voice guide (portal.voiceGuide → <audioPrefix>-<stage>.m4a)
 * and each step's interview questions (interview-<step id>-<n>.m4a).
 *
 * Prints JSON, { guides: [{ file, text }], interviews: [{ file, text }] }, each
 * sorted by file. Exits 1 if one file would need two different texts. Read by
 * scripts/generate-voice.py and scripts/generate-interview-voice.py.
 *
 *   npx tsx scripts/products/voice-sources.ts
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { productList } from "../../products/index";
import { allSteps } from "../../products/helpers";
import type { Product } from "../../products/types";

type Clip = { file: string; text: string };

export function voiceSources(products: readonly Product[] = productList): { guides: Clip[]; interviews: Clip[]; conflicts: string[] } {
  const conflicts: string[] = [];
  const collect = (clips: Clip[]) => {
    const byFile = new Map<string, string>();
    for (const { file, text } of clips) {
      const seen = byFile.get(file);
      if (seen !== undefined && seen !== text) conflicts.push(`${file}: "${seen}" vs "${text}"`);
      if (seen === undefined) byFile.set(file, text);
    }
    return [...byFile].map(([file, text]) => ({ file, text })).sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
  };
  const guides = collect(
    products.flatMap((p) => {
      const guide = p.portal?.voiceGuide;
      if (!guide) return [];
      return Object.entries(guide.scripts)
        .filter(([, text]) => Boolean(text))
        .map(([stage, text]) => ({ file: `${guide.audioPrefix}-${stage}.m4a`, text: text as string }));
    }),
  );
  const interviews = collect(
    products.flatMap((p) => allSteps(p).flatMap((step) => (step.interview ?? []).map((text, i) => ({ file: `interview-${step.id}-${i + 1}.m4a`, text })))),
  );
  return { guides, interviews, conflicts };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const { guides, interviews, conflicts } = voiceSources();
  if (conflicts.length) {
    console.error(`FAIL one audio file, two texts:\n  - ${conflicts.join("\n  - ")}`);
    process.exit(1);
  }
  console.log(JSON.stringify({ guides, interviews }, null, 2));
}
