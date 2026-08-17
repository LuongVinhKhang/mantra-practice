/* Content linter — reports suspected simplified→traditional conversion
 * artifacts in the built-in texts.
 *
 *   node test/lint-content.mjs
 *
 * This NEVER changes a text. Sacred texts are stored exactly as supplied; the
 * point of this tool is to tell you which characters are worth checking against
 * a printed source before you chant or write from them.
 *
 * Why these characters: one simplified character often maps to several
 * traditional ones (面/麵, 发/髮/發, 尽/盡/儘). Automatic converters routinely
 * pick the wrong one, so 蓮花面 "lotus face" becomes 蓮花麵 "lotus noodles".
 * Exits 0 always — this is a report, not a test.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sandbox = { window: {}, setTimeout, clearTimeout, console };
vm.createContext(sandbox);
for (const f of ['js/data.js', 'js/segment.js']) {
  vm.runInContext(readFileSync(join(root, f), 'utf8'), sandbox, { filename: f });
}
const M = sandbox.window.Mantra;

/* character in the text → what it usually should have been, and why */
const SUSPECT = {
  '麵': ['面', 'noodles / flour — 面 is "face, surface"'],
  '儘': ['盡', '儘 is "to the utmost"; 盡 is "exhaust, entirely"'],
  '髮': ['發', '髮 is "hair"; 發 is "to emit, issue"'],
  '噁': ['惡', '噁 is "nausea"; 惡 is "evil"'],
  '佈': ['布', '佈 is "announce"; 布 is "cloth, spread out"'],
  '錶': ['表', '錶 is "wristwatch"; 表 is "surface, express"'],
  '瞭': ['了', '瞭 is "clear, distant"; 了 is the aspect particle'],
  '幹': ['乾 / 干', '幹 is "trunk, to do"; usually 乾 "dry" was meant'],
  '鬆': ['松', '鬆 is "loose"; 松 is "pine tree"'],
  '準': ['准', '準 is "accurate"; 准 is "permit"'],
  '鍾': ['鐘', '鍾 is "cup, to concentrate"; 鐘 is "bell, clock"'],
  '週': ['周', '週 is "week"; 周 is the surname / "all around"'],
  '徵': ['征', '徵 is "summon, sign"; 征 is "journey, conquer"'],
  '慾': ['欲', '慾 is carnal desire; 欲 is the general "wish"'],
  '捲': ['卷', '捲 is the verb "roll up"; 卷 is the noun "scroll"'],
  '纔': ['才', '纔 is an archaic "only then"; 才 is "talent, only just"'],
  '嚮': ['向', '嚮 is "formerly"; 向 is "towards"']
};

let total = 0;
for (const t of M.TEXTS) {
  if (!t.text) continue;
  const lines = t.text.split('\n');
  const hits = [];
  lines.forEach((line, i) => {
    for (const ch of new Set(Array.from(line))) {
      if (SUSPECT[ch]) hits.push({ ch, line, n: i + 1 });
    }
  });
  if (!hits.length) continue;
  total += hits.length;
  console.log(`\n${t.name}  (${t.id}) — ${hits.length} to check`);
  for (const h of hits) {
    const [fix, why] = SUSPECT[h.ch];
    console.log(`  line ${String(h.n).padStart(3)}  ${h.line}`);
    console.log(`             ${h.ch} → probably ${fix}   (${why})`);
  }
}

console.log(total
  ? `\n${total} character(s) worth checking against a printed source.` +
    `\nNothing was changed — verify, then edit js/data.js yourself.\n`
  : '\nNo suspected conversion artifacts found.\n');
