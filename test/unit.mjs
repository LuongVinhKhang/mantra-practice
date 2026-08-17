/* Dependency-free unit tests for the pure logic (segment.js + engine.js).
 * Run:  node test/unit.mjs
 * No npm install, no build step — plain node reading the same files the
 * browser loads.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Minimal browser-ish sandbox: the source files only need `window` + timers.
const sandbox = { window: {}, setTimeout, clearTimeout, console };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
for (const f of ['js/data.js', 'js/segment.js', 'js/engine.js',
                 'js/readings.js', 'js/reading.js', 'js/store.js']) {
  vm.runInContext(readFileSync(join(root, f), 'utf8'), sandbox, { filename: f });
}
const M = sandbox.window.Mantra;

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const a = JSON.stringify(got), b = JSON.stringify(want);
  if (a === b) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n         got  ${a}\n         want ${b}`); }
};

console.log('\ndata integrity');
eq('ids are unique',
  new Set(M.TEXTS.map(t => t.id)).size, M.TEXTS.length);
eq('first entry is the custom slot',
  [M.TEXTS[0].id, M.TEXTS[0].text], ['custom', '']);
eq('no display label leaked into a text body',
  M.TEXTS.filter(t => /[·A-Za-z]/.test(t.text)).map(t => t.id), []);
eq('every non-custom text yields items',
  M.TEXTS.slice(1).filter(t => M.segmentWriting(t.text).length === 0).map(t => t.id), []);
eq('every mode has all three speeds',
  Object.keys(M.SPEEDS).every(m =>
    ['slow', 'normal', 'fast'].every(s => typeof M.SPEEDS[m][s] === 'number')), true);
eq('slow is slower than fast',
  Object.keys(M.SPEEDS).every(m => M.SPEEDS[m].slow > M.SPEEDS[m].fast), true);

console.log('\nsegmentWriting');
eq('splits characters',        M.segmentWriting('南無觀世音菩薩').length, 7);
eq('drops punctuation',        M.segmentWriting('天地玄黃，宇宙洪荒。'), ['天','地','玄','黃','宇','宙','洪','荒']);
eq('drops whitespace/newline', M.segmentWriting(' 一\n二\t三 '), ['一','二','三']);
eq('empty string',             M.segmentWriting(''), []);
eq('punctuation only',         M.segmentWriting('，。！？'), []);
eq('latin passes through',     M.segmentWriting('abc'), ['a','b','c']);
// Surrogate pair: 𠀀 is U+20000, outside the BMP. split('') would break it.
eq('non-BMP char stays whole', M.segmentWriting('𠀀一'), ['𠀀','一']);

console.log('\nsegmentChanting');
eq('short text = one item',    M.segmentChanting('南無觀世音菩薩'), ['南無觀世音菩薩']);
eq('breaks on punctuation',    M.segmentChanting('天地玄黃，宇宙洪荒。'), ['天地玄黃','宇宙洪荒']);
eq('breaks on newline',        M.segmentChanting('一二三\n四五六'), ['一二三','四五六']);
eq('empty string',             M.segmentChanting(''), []);
eq('punctuation only',         M.segmentChanting('，。'), []);
eq('9-char verse line stays whole',
   M.segmentChanting('在那深廣知識天空中\n圓滿智慧金輪所放光'),
   ['在那深廣知識天空中', '圓滿智慧金輪所放光']);
{
  const long = '一'.repeat(30);
  const out = M.segmentChanting(long);
  eq('long run is chunked',    out.length > 1, true);
  eq('no chunk exceeds max',   out.every(s => Array.from(s).length <= 12), true);
  eq('chunks rejoin to source', out.join(''), long);
}

console.log('\nManjushri prayer (user-supplied content)');
{
  const t = M.TEXTS.find(x => x.id === 'manjushri');
  const lines = t.text.split('\n');
  eq('13 verses × 4 lines',        lines.length, 52);
  eq('every line is 9 characters', [...new Set(lines.map(l => Array.from(l).length))], [9]);
  eq('468 characters to write',    M.segmentWriting(t.text).length, 468);
  eq('52 lines to chant',          M.segmentChanting(t.text).length, 52);
  eq('no line is split in chanting mode', M.segmentChanting(t.text), lines);
  eq('first line',  lines[0],  '在那深廣知識天空中');
  eq('last line',   lines[51], '助我神力如您文殊師');
}

console.log('\nrepeat');
eq('repeat 1 = identity',      M.repeat(['a','b'], 1), ['a','b']);
eq('repeat 3',                 M.repeat(['a','b'], 3), ['a','b','a','b','a','b']);
eq('repeat 0 clamps to 1',     M.repeat(['a'], 0), ['a']);
eq('repeat NaN clamps to 1',   M.repeat(['a'], 'x'), ['a']);

console.log('\nEngine — manual');
{
  const seen = [];
  const e = new M.Engine(['a','b','c'], { auto: false, onChange: s => seen.push(s) });
  e.start();
  eq('starts at index 0',      e.index, 0);
  eq('does not autoplay',      e.playing, false);
  e.next(); eq('next',         e.index, 1);
  e.prev(); eq('prev',         e.index, 0);
  e.prev(); eq('prev at 0 stays', e.index, 0);
  e.next(); e.next();          eq('at last item', e.index, 2);
  e.next(); eq('next at end finishes', e.finished, true);
  e.next(); eq('next after finish is a no-op', e.index, 2);
  e.restart(); eq('restart resets index', e.index, 0);
  eq('restart clears finished', e.finished, false);
  e.destroy();
}

console.log('\nEngine — auto + pause/resume');
await new Promise(resolve => {
  const e = new M.Engine(['a','b','c'], { intervalMs: 120, auto: true });
  const t0 = Date.now();
  e.start();
  eq('autoplay starts playing', e.playing, true);

  setTimeout(() => {                       // 60ms in: half the interval used
    e.pause();
    eq('paused stops playing', e.playing, false);
    eq('still on first item while paused', e.index, 0);

    setTimeout(() => {                     // sit paused for 300ms
      eq('no advance while paused', e.index, 0);
      e.play();
      setTimeout(() => {                   // ~70ms after resume (60 left + slack)
        eq('resumes and advances once', e.index, 1);
        e.destroy();
        setTimeout(() => {
          eq('destroy stops the timer', e.index, 1);
          eq('total elapsed is sane', Date.now() - t0 < 2000, true);
          resolve();
        }, 300);
      }, 110);
    }, 300);
  }, 60);
});

console.log('\nEngine — auto reaches the end');
await new Promise(resolve => {
  const e = new M.Engine(['a','b'], { intervalMs: 40, auto: true });
  e.onChange = s => {
    if (s.finished) {
      eq('auto run finishes', true, true);
      e.destroy();
      resolve();
    }
  };
  e.start();
});

console.log('\nEngine — single item');
{
  const e = new M.Engine(['只'], { auto: false });
  e.start();
  eq('single item index', e.index, 0);
  e.next();
  eq('single item finishes on next', e.finished, true);
  e.destroy();
}

console.log('\n21 Taras praise (user-supplied content)');
{
  const t = M.TEXTS.find(x => x.id === 'tara21');
  const lines = t.text.split('\n');
  eq('21 verses × 4 lines',        lines.length, 84);
  eq('every line is 7 characters', [...new Set(lines.map(l => Array.from(l).length))], [7]);
  eq('588 characters to write',    M.segmentWriting(t.text).length, 588);
  eq('84 lines to chant',          M.segmentChanting(t.text).length, 84);
  eq('no line is split',           M.segmentChanting(t.text), lines);
  eq('first line', lines[0],  '敬禮迅捷勇度母');
  eq('last line',  lines[83], '都熱最極除災禍');

  // The 15 simplified→traditional conversion artifacts are corrected.
  eq('no conversion artifacts remain',
     Array.from('麵儘髮噁佈').filter(ch => t.text.includes(ch)), []);
  eq('麵 → 面 (lotus face, not lotus noodles)', lines[2],  '三世界尊蓮花面');
  eq('麵 → 面 (spotless face)',                 lines[5],  '普遍圓滿無垢面');
  eq('儘 → 盡',                                 lines[14], '得到彼岸盡無餘');
  eq('髮 → 發 (mouth emits, not mouth hair)',   lines[24], '敬禮口發齋呸母');
  eq('噁 → 惡 (evil, not nausea)',              lines[51], '能摧滅壞惡冤輪');
  eq('佈 → 布',                                 lines[62], '十字真言妙嚴布');
  eq('鬥 in 鬥爭 left alone (correct already)', lines[75], '滅除鬥爭及惡夢');
  eq('still 588 characters after the fix', M.segmentWriting(t.text).length, 588);
}

console.log('\n楞嚴咒 Shurangama mantra (user-supplied content)');
{
  const t = M.TEXTS.find(x => x.id === 'shurangama');
  const lines = t.text.split('\n');
  const phrases = M.segmentChanting(t.text);
  eq('141 caption lines',   lines.length, 141);
  eq('455 phrases to chant', phrases.length, 455);
  eq('2619 characters to write', M.segmentWriting(t.text).length, 2619);
  eq('source spacing is never chunked',
     phrases.join(''), lines.join('').split(' ').join(''));
  eq('longest phrase survives whole',
     phrases.filter(p => Array.from(p).length === 13), ['陀突嚧迦建咄嚧吉知婆路多毗']);
  // 𤙖 is U+24656 — a surrogate pair. split('') would emit two broken halves.
  eq('non-BMP 𤙖 stays one item',
     M.segmentWriting(t.text).filter(c => c === '𤙖').length, 11);
  eq('no broken surrogate halves',
     M.segmentWriting(t.text).some(c => {
       const n = c.charCodeAt(0);
       return n >= 0xD800 && n <= 0xDFFF && c.length === 1;
     }), false);
  eq('first line',  lines[0],   '南無薩怛他蘇伽多耶 阿囉訶帝');
  eq('last line',   lines[140], '虎𤙖 都嚧甕泮 莎訶');
}

console.log('\nEngine — start(fromIndex) and jumpTo');
{
  const e = new M.Engine(['a','b','c','d','e'], { auto: false });
  e.start(3);
  eq('starts at the saved index', e.index, 3);
  eq('not finished when resuming', e.finished, false);
  e.start(99);
  eq('out-of-range index clamps to last', e.index, 4);
  e.start(-5);
  eq('negative index clamps to 0', e.index, 0);
  e.jumpTo(2);
  eq('jumpTo moves', e.index, 2);
  e.jumpTo(1000);
  eq('jumpTo clamps', e.index, 4);
  e.next();
  eq('finished at the end', e.finished, true);
  e.jumpTo(0);
  eq('jumpTo revives a finished session', [e.index, e.finished], [0, false]);
  e.restart();
  eq('restart still goes to 0', e.index, 0);
  e.destroy();
}

console.log('\nReadings — Hán-Việt and pinyin');
{
  eq('readings table loaded', typeof M.READINGS === 'object' && M.READINGS !== null, true);
  eq('table has >10000 characters', Object.keys(M.READINGS).length > 10000, true);
  // 南無 is "nam mô" when chanted, not the character-by-character "nam vô".
  eq('南無 override applied',
     M.reading('南無觀世音菩薩', 0), 'nam mô quan thế âm bồ tát');
  eq('南無阿彌陀佛 hán-việt',
     M.reading('南無阿彌陀佛', 0), 'nam mô a di đà phật');
  eq('six-syllable mantra hán-việt',
     M.reading('唵嘛呢叭咪吽', 0), 'úm ma ni bá mi hồng');
  eq('pinyin',
     M.reading('南無觀世音菩薩', 1), 'nán wú guān shì yīn pú sà');
  // Unihan lists 地 as "de dì"; the neutral-tone particle must not win.
  eq('地 pinyin is dì not de', M.reading('天地', 1), 'tiān dì');
  eq('unknown character shows a placeholder, not a crash',
     M.reading('\u{24656}', 0), '·');
  eq('empty text', M.reading('', 0), '');

  const t = M.TEXTS.find(x => x.id === 'shurangama');
  const missing = M.segmentWriting(t.text).filter(c => !M.READINGS[c]);
  eq('楞嚴咒 has no unknown characters left', [...new Set(missing)], []);
}

console.log('\nStore — degrades without localStorage');
{
  // The sandbox has no window.localStorage at all; nothing may throw.
  eq('read returns an object', typeof M.store.read(), 'object');
  eq('available() is false here', M.store.available(), false);
  eq('write does not throw', M.store.write({ a: 1 }), false);
  eq('patch does not throw', typeof M.store.patch({ a: 1 }), 'object');
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
