import { chromium } from 'playwright';

import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

// Tests the app over file:// — the same way you open it by double-clicking.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP = pathToFileURL(join(root, 'index.html')).href;
let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${extra}`); }
};

const browser = await chromium.launch();

// ── Desktop pass ────────────────────────────────────────────────────
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(APP);
await page.waitForTimeout(200);

console.log('\nDoD 1–2: open site, select a built-in text (over file://)');
check('no JS/console errors on load', errors.length === 0, errors.join(' | '));
check('dropdown populated', (await page.locator('#text-select option').count()) === 9,
  String(await page.locator('#text-select option').count()));
check('dropdown is grouped',
  (await page.locator('#text-select optgroup').count()) === 4,
  String(await page.locator('#text-select optgroup').count()));
check('filler 一二三…十 is gone',
  (await page.locator('#text-select option[value="digits"]').count()) === 0);
await page.selectOption('#text-select', 'guanyin');
check('built-in loads into textarea',
  (await page.inputValue('#text-input')) === '南無觀世音菩薩');
check('preview shows counts',
  /^7 characters to write$/.test(await page.textContent('#preview-meta')),
  await page.textContent('#preview-meta'));
await page.check('input[name="mode"][value="chanting"]');
check('preview updates with mode',
  /^7 characters · 1 phrase to chant$/.test(await page.textContent('#preview-meta')),
  await page.textContent('#preview-meta'));
await page.fill('#repeat-input', '3');
check('preview shows repeat maths',
  /× 3 = 3 items/.test(await page.textContent('#preview-meta')),
  await page.textContent('#preview-meta'));
await page.fill('#repeat-input', '1');
await page.check('input[name="mode"][value="writing"]');

check('speed enabled in automatic mode',
  await page.locator('#speed-select').isEnabled());
await page.check('input[name="prog"][value="manual"]');
check('speed disabled in manual mode',
  await page.locator('#speed-select').isDisabled());
await page.check('input[name="prog"][value="auto"]');
check('speed re-enabled back in automatic',
  await page.locator('#speed-select').isEnabled());

console.log('\nDoD 3–4: paste own text, warn before replacing it');
await page.fill('#text-input', '我的自訂文字');
await page.selectOption('#text-select', 'amitabha');
check('replace warning appears', await page.locator('#confirm').isVisible());
await page.click('#confirm-cancel');
check('cancel keeps custom text',
  (await page.inputValue('#text-input')) === '我的自訂文字');
check('cancel reverts dropdown', (await page.inputValue('#text-select')) === 'guanyin');

await page.selectOption('#text-select', 'amitabha');
await page.click('#confirm-replace');
check('replace swaps the text',
  (await page.inputValue('#text-input')) === '南無阿彌陀佛');

console.log('\nEdge cases the spec does not mention');
await page.fill('#text-input', '');
await page.click('#start-btn');
check('empty text blocked', await page.locator('#home-error').isVisible());
check('still on home screen', await page.locator('#screen-home').isVisible());
await page.fill('#text-input', '，。！？ \n\t');
await page.click('#start-btn');
check('punctuation-only blocked',
  /only punctuation or spaces/.test(await page.textContent('#home-error')));
await page.fill('#text-input', '南無觀世音菩薩');
await page.fill('#repeat-input', '9999');
await page.click('#start-btn');
check('repeat clamped to 1080', (await page.inputValue('#repeat-input')) === '1080');
check('clamped session started', await page.locator('#screen-practice').isVisible());
await page.click('#btn-exit');

console.log('\nDoD 5–7: writing mode, one character at a time');
await page.fill('#repeat-input', '1');
await page.check('input[name="mode"][value="writing"]');
await page.check('input[name="prog"][value="manual"]');
await page.click('#start-btn');
check('practice screen shown', await page.locator('#screen-practice').isVisible());
check('shows ONE character', (await page.textContent('#item')) === '南');
check('counter 1 / 7', (await page.textContent('#counter')) === '1 / 7');
const fs1 = await page.locator('#item').evaluate(n => getComputedStyle(n).fontSize);
check('character is large (>150px)', parseFloat(fs1) > 150, fs1);

console.log('\nDoD 10–11: forward / backward / restart');
await page.click('#btn-next');
check('next → 無', (await page.textContent('#item')) === '無');
await page.keyboard.press('ArrowRight');
check('ArrowRight → 觀', (await page.textContent('#item')) === '觀');
await page.keyboard.press('ArrowLeft');
check('ArrowLeft → 無', (await page.textContent('#item')) === '無');
await page.click('#btn-restart');
check('restart → first item', (await page.textContent('#counter')) === '1 / 7');
check('pause button hidden in manual mode', await page.locator('#btn-toggle').isHidden());

console.log('\nDoD 12: finish the practice');
for (let i = 0; i < 7; i++) await page.keyboard.press('Space');
check('completion screen shown', await page.locator('#screen-done').isVisible());
check('completion copy', /Practice complete/.test(await page.textContent('.done-box')));
await page.click('#btn-again');
check('practice again restarts', (await page.textContent('#counter')) === '1 / 7');
await page.click('#btn-exit');

console.log('\nDoD 8: speaking mode shows phrases, not characters');
await page.fill('#text-input', '天地玄黃，宇宙洪荒。日月盈昃，辰宿列張。');
await page.check('input[name="mode"][value="chanting"]');
await page.click('#start-btn');
check('shows a phrase', (await page.textContent('#item')) === '天地玄黃');
check('counter 1 / 4', (await page.textContent('#counter')) === '1 / 4');
await page.click('#btn-next');
check('next phrase', (await page.textContent('#item')) === '宇宙洪荒');
await page.click('#btn-exit');

console.log('\nDoD 9: automatic progression + pause/resume');
await page.check('input[name="prog"][value="auto"]');
await page.selectOption('#speed-select', 'fast');   // 2000ms for chanting
await page.click('#start-btn');
check('starts playing', (await page.textContent('#btn-toggle')) === 'Pause');
await page.waitForTimeout(2400);
check('auto-advanced without input', (await page.textContent('#counter')) === '2 / 4');
await page.click('#btn-toggle');
check('button reads Resume', (await page.textContent('#btn-toggle')) === 'Resume');
const atPause = await page.textContent('#counter');
await page.waitForTimeout(2500);
check('does NOT advance while paused', (await page.textContent('#counter')) === atPause);
await page.keyboard.press('Space');
check('Space resumes', (await page.textContent('#btn-toggle')) === 'Pause');
await page.waitForTimeout(2400);
check('advances again after resume', (await page.textContent('#counter')) === '3 / 4');
await page.keyboard.press('Escape');
check('Escape exits to home', await page.locator('#screen-home').isVisible());
await page.waitForTimeout(2500);
check('timer stopped after exit — still on home',
  await page.locator('#screen-home').isVisible());

console.log('\nManjushri prayer end to end');
await page.selectOption('#text-select', 'manjushri');
await page.click('#confirm-replace').catch(() => {});   // may or may not warn
await page.check('input[name="prog"][value="manual"]');
await page.check('input[name="mode"][value="chanting"]');
check('chanting preview = 52 phrases',
  /^468 characters · 52 phrases to chant$/.test(await page.textContent('#preview-meta')),
  await page.textContent('#preview-meta'));
await page.click('#start-btn');
check('first line whole, not split',
  (await page.textContent('#item')) === '在那深廣知識天空中');
check('counter 1 / 52', (await page.textContent('#counter')) === '1 / 52');
const lineBox = await page.locator('#item').boundingBox();
check('9-char line fits the viewport', lineBox.width <= 1280, JSON.stringify(lineBox));
await page.click('#btn-exit');

await page.check('input[name="mode"][value="writing"]');
check('writing preview = 468 characters',
  /^468 characters to write$/.test(await page.textContent('#preview-meta')),
  await page.textContent('#preview-meta'));
await page.click('#start-btn');
check('writing shows one character', (await page.textContent('#item')) === '在');
check('counter 1 / 468', (await page.textContent('#counter')) === '1 / 468');
await page.click('#btn-exit');

console.log('\n21 Taras + Shurangama end to end');
for (const [id, chant, write, first] of [
  ['tara21',     84,  588,  '敬禮迅捷勇度母'],
  ['shurangama', 455, 2619, '南無薩怛他蘇伽多耶'],
]) {
  await page.selectOption('#text-select', id);
  await page.click('#confirm-replace').catch(() => {});
  await page.check('input[name="prog"][value="manual"]');
  await page.check('input[name="mode"][value="chanting"]');
  check(`${id}: preview = ${chant} phrases`,
    new RegExp(`^${write} characters · ${chant} phrases to chant$`)
      .test(await page.textContent('#preview-meta')),
    await page.textContent('#preview-meta'));
  await page.click('#start-btn');
  check(`${id}: first phrase whole`, (await page.textContent('#item')) === first,
    await page.textContent('#item'));
  check(`${id}: counter 1 / ${chant}`,
    (await page.textContent('#counter')) === `1 / ${chant}`);
  await page.click('#btn-exit');
}

// The 13-character phrase and the non-BMP 𤙖 must both render as written.
await page.selectOption('#text-select', 'shurangama');
await page.click('#confirm-replace').catch(() => {});
await page.check('input[name="mode"][value="chanting"]');
await page.click('#start-btn');
const long13 = await page.evaluate(() => {
  const items = Mantra.segmentChanting(document.getElementById('text-input').value);
  return items.indexOf('陀突嚧迦建咄嚧吉知婆路多毗');
});
check('13-char phrase present in the item list', long13 > -1, String(long13));
await page.click('#btn-exit');

await page.check('input[name="mode"][value="writing"]');
await page.click('#start-btn');
const hum = await page.evaluate(() => {
  const items = Mantra.segmentWriting(document.getElementById('text-input').value);
  return { count: items.filter(c => c === '\u{24656}').length,
           len: items.filter(c => c === '\u{24656}').map(c => c.length)[0] };
});
check('non-BMP 𤙖 is 11 whole items', hum.count === 11 && hum.len === 2,
  JSON.stringify(hum));
await page.click('#btn-exit');

console.log('\nBatch 1: pronunciation line');
await page.selectOption('#text-select', 'guanyin');
await page.click('#confirm-replace').catch(() => {});
await page.check('input[name="mode"][value="chanting"]');
await page.check('input[name="prog"][value="manual"]');
check('reading toggles start off', !(await page.isChecked('#opt-hv')));
await page.click('#start-btn');
check('no reading line when both toggles off',
  (await page.locator('#reading-hv').isHidden()) &&
  (await page.locator('#reading-py').isHidden()));
await page.click('#btn-exit');
await page.check('#opt-hv');
await page.check('#opt-py');
await page.click('#start-btn');
check('hán-việt line shown',
  (await page.textContent('#reading-hv')) === 'nam mô quan thế âm bồ tát',
  await page.textContent('#reading-hv'));
check('pinyin line shown',
  (await page.textContent('#reading-py')) === 'nán wú guān shì yīn pú sà',
  await page.textContent('#reading-py'));
await page.click('#btn-exit');
await page.check('input[name="mode"][value="writing"]');
await page.click('#start-btn');
check('reading follows single characters',
  (await page.textContent('#reading-hv')) === 'nam');
await page.click('#btn-next');
// 無 alone must still read "mô", because 南無 is chanted "nam mô".
check('isolated 無 keeps its in-context reading',
  (await page.textContent('#reading-hv')) === 'mô',
  await page.textContent('#reading-hv'));
await page.click('#btn-next');
check('third character reads quan',
  (await page.textContent('#reading-hv')) === 'quan',
  await page.textContent('#reading-hv'));
await page.click('#btn-exit');
await page.uncheck('#opt-hv');
await page.uncheck('#opt-py');

console.log('\nPreview block shows what the mode does');
await page.selectOption('#text-select', 'tara21');
await page.click('#confirm-replace').catch(() => {});
await page.check('input[name="mode"][value="writing"]');
check('preview block visible', await page.locator('#preview').isVisible());
check('writing preview shows single characters',
  (await page.locator('#preview-items .pv-cell').allTextContents()).join('|') === '敬|禮|迅|捷|勇|度',
  (await page.locator('#preview-items .pv-cell').allTextContents()).join('|'));
check('writing hint',
  /one character/.test(await page.textContent('#preview-hint')));
check('overflow count shown',
  (await page.textContent('#preview-items .pv-more')) === '+582',
  await page.textContent('#preview-items .pv-more'));
await page.check('input[name="mode"][value="chanting"]');
check('chanting preview re-cuts into phrases',
  (await page.locator('#preview-items .pv-cell').allTextContents())[0] === '敬禮迅捷勇度母',
  (await page.locator('#preview-items .pv-cell').allTextContents())[0]);
check('chanting hint',
  /one phrase/.test(await page.textContent('#preview-hint')));
await page.fill('#text-input', '');
check('preview hidden when there is no text',
  await page.locator('#preview').isHidden());
await page.selectOption('#text-select', 'tara21');
await page.click('#confirm-replace').catch(() => {});

console.log('\nOverview keeps the source line structure');
await page.check('input[name="mode"][value="writing"]');
await page.check('input[name="prog"][value="manual"]');
await page.click('#start-btn');
await page.click('#counter');
check('84 rows, one per verse line',
  (await page.locator('#ov-grid .ov-row').count()) === 84,
  String(await page.locator('#ov-grid .ov-row').count()));
check('each row holds 7 characters',
  (await page.locator('#ov-grid .ov-row').first().locator('.ov-cell').count()) === 7);
check('first row is the first verse line',
  (await page.locator('#ov-grid .ov-row').first().textContent()) === '敬禮迅捷勇度母');
await page.keyboard.press('Escape');
await page.click('#btn-exit');
await page.click('#resume-clear').catch(() => {});

console.log('\nBatch 1: overview map and jump');
await page.selectOption('#text-select', 'shurangama');
await page.click('#confirm-replace').catch(() => {});
await page.check('input[name="mode"][value="chanting"]');
await page.click('#start-btn');
check('overview hidden at first', await page.locator('#overview').isHidden());
const tOpen = Date.now();
await page.click('#counter');
check('overview opens', await page.locator('#overview').isVisible());
check('overview renders all 455 items',
  (await page.locator('#ov-grid .ov-cell').count()) === 455,
  String(await page.locator('#ov-grid .ov-cell').count()));
check('overview opens fast (<2s for 455 cells)', Date.now() - tOpen < 2000,
  String(Date.now() - tOpen) + 'ms');
check('current item marked',
  (await page.locator('#ov-grid .is-current').getAttribute('data-i')) === '0');
await page.click('#ov-grid .ov-cell[data-i="300"]');
check('jump closes the overview', await page.locator('#overview').isHidden());
check('jumped to item 301', (await page.textContent('#counter')) === '301 / 455');
await page.click('#counter');
check('current marker moved',
  (await page.locator('#ov-grid .is-current').getAttribute('data-i')) === '300');
await page.keyboard.press('Escape');
check('Escape closes overview, stays in practice',
  (await page.locator('#overview').isHidden()) &&
  (await page.locator('#screen-practice').isVisible()));
check('grid emptied on close',
  (await page.locator('#ov-grid .ov-cell').count()) === 0);
await page.keyboard.press('o');
check('keyboard "o" opens overview', await page.locator('#overview').isVisible());
await page.keyboard.press('Escape');

console.log('\nBatch 1: resume after exit');
await page.click('#btn-exit');
check('resume banner appears', await page.locator('#resume-box').isVisible());
check('resume banner shows the position',
  /301 \/ 455/.test(await page.textContent('#resume-text')),
  await page.textContent('#resume-text'));
await page.reload();
await page.waitForTimeout(300);
check('resume survives a page reload', await page.locator('#resume-box').isVisible());
check('position survived the reload',
  /301 \/ 455/.test(await page.textContent('#resume-text')),
  await page.textContent('#resume-text'));
await page.click('#resume-go');
check('resumed into practice', await page.locator('#screen-practice').isVisible());
check('resumed at the saved item',
  (await page.textContent('#counter')) === '301 / 455',
  await page.textContent('#counter'));
await page.click('#btn-exit');
await page.click('#resume-clear');
check('start over clears the banner', await page.locator('#resume-box').isHidden());
await page.reload();
await page.waitForTimeout(300);
check('cleared banner stays cleared', await page.locator('#resume-box').isHidden());

console.log('\nBatch 1: settings persist across reload');
await page.check('input[name="mode"][value="chanting"]');
await page.check('#opt-hv');
await page.check('input[name="prog"][value="auto"]');
await page.selectOption('#speed-select', 'slow');
await page.click('#size-up');
await page.click('#size-up');
const sizeBefore = await page.textContent('#size-val');
await page.reload();
await page.waitForTimeout(300);
check('mode persisted', await page.isChecked('input[name="mode"][value="chanting"]'));
check('hán-việt toggle persisted', await page.isChecked('#opt-hv'));
check('speed persisted', (await page.inputValue('#speed-select')) === 'slow');
check('text size persisted', (await page.textContent('#size-val')) === sizeBefore,
  `${await page.textContent('#size-val')} vs ${sizeBefore}`);
check('text persisted', (await page.inputValue('#text-input')).length > 100);

console.log('\nBatch 1: text size changes the type');
await page.check('input[name="prog"][value="manual"]');
await page.click('#start-btn');
const bigFont = parseFloat(await page.locator('#item').evaluate(n => getComputedStyle(n).fontSize));
await page.click('#btn-exit');
for (let i = 0; i < 6; i++) await page.click('#size-down');
await page.click('#start-btn');
const smallFont = parseFloat(await page.locator('#item').evaluate(n => getComputedStyle(n).fontSize));
check('A− makes the character smaller', smallFont < bigFont, `${bigFont} -> ${smallFont}`);
await page.click('#btn-exit');
for (let i = 0; i < 4; i++) await page.click('#size-up');

console.log('\nBatch 1: share link / deep link');
check('share button hidden on file:// (no real URL to share)',
  await page.locator('#share-btn').isHidden());
// The receiving half of a share link: open with settings in the hash.
await page.goto(APP + '#t=tara21&m=chanting&p=manual&s=fast&r=2&hv=1&py=1');
await page.waitForTimeout(300);
check('deep link picked the text', (await page.inputValue('#text-select')) === 'tara21');
check('deep link loaded the text body',
  (await page.inputValue('#text-input')).startsWith('敬禮迅捷勇度母'));
check('deep link set mode', await page.isChecked('input[name="mode"][value="chanting"]'));
check('deep link set progression', await page.isChecked('input[name="prog"][value="manual"]'));
check('deep link set repeat', (await page.inputValue('#repeat-input')) === '2');
check('deep link set both readings',
  (await page.isChecked('#opt-hv')) && (await page.isChecked('#opt-py')));
check('deep link preview reflects repeat',
  /168 items/.test(await page.textContent('#preview-meta')),
  await page.textContent('#preview-meta'));
await page.click('#start-btn');
check('deep-linked session runs',
  (await page.textContent('#counter')) === '1 / 168',
  await page.textContent('#counter'));
check('deep-linked reading line shows',
  (await page.textContent('#reading-hv')) === 'kính lễ tấn tiệp dũng độ mẫu',
  await page.textContent('#reading-hv'));
await page.click('#btn-exit');
await page.click('#resume-clear').catch(() => {});
await page.goto(APP);
await page.waitForTimeout(200);
await page.uncheck('#opt-hv');
await page.uncheck('#opt-py');
await page.fill('#repeat-input', '1');

console.log('\nInterface language');
await page.goto(APP);
await page.waitForTimeout(300);
check('language selector has 4 options',
  (await page.locator('#lang-select option').count()) === 4);
check('starts in English', (await page.textContent('#start-btn')) === 'Start Practice');
await page.selectOption('#lang-select', 'vi');
check('vietnamese start button', (await page.textContent('#start-btn')) === 'Bắt đầu',
  await page.textContent('#start-btn'));
check('vietnamese mode label',
  /Đọc \/ Tụng/.test(await page.textContent('#screen-home')));
check('html lang attribute follows',
  (await page.getAttribute('html', 'lang')) === 'vi');
check('optgroup labels translated',
  (await page.locator('#text-select optgroup').first().getAttribute('label')) === 'Bài dài',
  await page.locator('#text-select optgroup').first().getAttribute('label'));
await page.selectOption('#lang-select', 'zh-Hant');
check('traditional chinese', (await page.textContent('#start-btn')) === '開始練習');
await page.selectOption('#lang-select', 'zh-Hans');
check('simplified chinese', (await page.textContent('#start-btn')) === '开始练习');
check('document title follows language',
  (await page.title()) === '持诵练习', await page.title());
await page.reload();
await page.waitForTimeout(300);
check('language persists across reload',
  (await page.inputValue('#lang-select')) === 'zh-Hans');
// in-practice strings translate too
await page.selectOption('#text-select', 'guanyin');
await page.click('#confirm-replace').catch(() => {});
await page.check('input[name="prog"][value="auto"]');
await page.click('#start-btn');
check('pause button translated', (await page.textContent('#btn-toggle')) === '暂停',
  await page.textContent('#btn-toggle'));
await page.click('#btn-toggle');
check('resume button translated', (await page.textContent('#btn-toggle')) === '继续');
await page.click('#counter');
check('overview hint translated',
  /点任一项/.test(await page.textContent('.ov-hint')));
await page.keyboard.press('Escape');
await page.click('#btn-exit');
await page.click('#resume-clear').catch(() => {});
await page.selectOption('#lang-select', 'en');

console.log('\nCantonese reading line');
await page.selectOption('#text-select', 'guanyin');
await page.click('#confirm-replace').catch(() => {});
await page.check('input[name="mode"][value="chanting"]');
await page.check('input[name="prog"][value="manual"]');
await page.check('#opt-yue');
await page.click('#start-btn');
check('cantonese line shown',
  (await page.textContent('#reading-yue')) === 'naam4 mou4 gun1 sai3 jam1 pou4 saat3',
  await page.textContent('#reading-yue'));
await page.click('#btn-exit');
await page.check('#opt-hv');
await page.check('#opt-py');
await page.click('#start-btn');
check('all three reading lines can show at once',
  (await page.locator('#reading-hv').isVisible()) &&
  (await page.locator('#reading-py').isVisible()) &&
  (await page.locator('#reading-yue').isVisible()));
await page.click('#btn-exit');
await page.uncheck('#opt-hv');
await page.uncheck('#opt-py');
await page.uncheck('#opt-yue');
await page.click('#resume-clear').catch(() => {});

console.log('\nRead aloud degrades honestly');
const sp = await page.evaluate(() => ({
  supported: window.Mantra.speech.supported(),
  langs: window.Mantra.speech.available(),
  fieldHidden: document.getElementById('speak-field').hidden,
  speakBtnHidden: document.getElementById('btn-speak').hidden,
  note: document.getElementById('speak-note').textContent
}));
check('speech field hidden when unsupported, shown when supported',
  sp.fieldHidden === !sp.supported, JSON.stringify(sp));
check('speak button hidden while voice is Off', sp.speakBtnHidden === true);
check('only real voices are offered',
  (await page.locator('#speak-select option').count()) === sp.langs.length + 1,
  `${await page.locator('#speak-select option').count()} vs ${sp.langs.length}+1`);
check('honest note when no voices exist',
  sp.langs.length > 0 || /no speech voices/i.test(sp.note), sp.note);

console.log('\nProgress bar');
await page.fill('#text-input', '天地玄黃，宇宙洪荒。日月盈昃，辰宿列張。');
await page.check('input[name="mode"][value="chanting"]');
await page.check('input[name="prog"][value="auto"]');
await page.click('#start-btn');
await page.click('#btn-toggle');                 // pause so auto-advance can't interfere
const s0 = await page.locator('#bar-fill').evaluate(n => n.style.width);
const w0 = await page.locator('#bar-fill').evaluate(n => n.getBoundingClientRect().width);
await page.click('#btn-next');
const s1 = await page.locator('#bar-fill').evaluate(n => n.style.width);
await page.waitForTimeout(300);                  // let the .18s CSS transition settle
const w1 = await page.locator('#bar-fill').evaluate(n => n.getBoundingClientRect().width);
check('progress bar target width grows', parseFloat(s1) > parseFloat(s0), `${s0} → ${s1}`);
check('progress bar rendered width grows', w1 > w0, `${w0} → ${w1}`);
await page.click('#btn-exit');

check('no JS errors across the whole desktop run', errors.length === 0, errors.join(' | '));
await ctx.close();

// ── Mobile pass (DoD 13) ────────────────────────────────────────────
console.log('\nDoD 13: mobile phone (iPhone 12 viewport, touch)');
const mctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  deviceScaleFactor: 3
});
const m = await mctx.newPage();
const merrors = [];
m.on('pageerror', e => merrors.push(String(e)));
await m.goto(APP);
await m.waitForTimeout(200);

const hScroll = await m.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth);
check('home does not scroll sideways', !hScroll);

await m.selectOption('#text-select', 'guanyin');
await m.check('input[name="prog"][value="manual"]');
await m.click('#start-btn');
check('practice fits the screen height', await m.evaluate(() =>
  document.getElementById('screen-practice').getBoundingClientRect().height <= window.innerHeight + 1));

const box = await m.locator('#item').boundingBox();
check('character fits within viewport width', box.width <= 390, JSON.stringify(box));
check('character is large on mobile (>150px)', box.height > 150, JSON.stringify(box));

// tap zones: right third = next, left third = prev
const stage = await m.locator('#stage').boundingBox();
await m.touchscreen.tap(stage.x + stage.width * 0.9, stage.y + stage.height / 2);
check('tap right → next', (await m.textContent('#counter')) === '2 / 7');
await m.touchscreen.tap(stage.x + stage.width * 0.1, stage.y + stage.height / 2);
check('tap left → prev', (await m.textContent('#counter')) === '1 / 7');
await m.touchscreen.tap(stage.x + stage.width * 0.5, stage.y + stage.height / 2);
check('tap centre → next (manual mode)', (await m.textContent('#counter')) === '2 / 7');

const ctrls = await m.locator('#btn-prev').boundingBox();
check('controls meet 44px touch target', ctrls.height >= 44, String(ctrls.height));

// iOS double-tap-to-zoom: two fast taps on Next must advance twice, not zoom.
const ta = await m.evaluate(() => ({
  next:    getComputedStyle(document.getElementById('btn-next')).touchAction,
  prev:    getComputedStyle(document.getElementById('btn-prev')).touchAction,
  zone:    getComputedStyle(document.querySelector('.zone')).touchAction,
  stage:   getComputedStyle(document.getElementById('stage')).touchAction,
  counter: getComputedStyle(document.getElementById('counter')).touchAction
}));
check('touch-action: manipulation on Next (kills double-tap zoom)',
  ta.next === 'manipulation', JSON.stringify(ta));
check('touch-action: manipulation on Prev', ta.prev === 'manipulation', ta.prev);
check('touch-action: manipulation on the tap zones', ta.zone === 'manipulation', ta.zone);
check('touch-action: manipulation on the stage', ta.stage === 'manipulation', ta.stage);
check('touch-action: manipulation on the counter', ta.counter === 'manipulation', ta.counter);
check('pinch-zoom still allowed (no user-scalable=no)',
  !/user-scalable\s*=\s*no/.test(
    await m.evaluate(() => document.querySelector('meta[name=viewport]').content)),
  await m.evaluate(() => document.querySelector('meta[name=viewport]').content));

// Needs a text long enough that 10 taps cannot reach the end.
await m.click('#btn-exit');
await m.selectOption('#text-select', 'manjushri');
await m.click('#confirm-replace').catch(() => {});
await m.check('input[name="mode"][value="writing"]');
await m.click('#start-btn');
const startN = parseInt((await m.textContent('#counter')).split('/')[0], 10);
const nb = await m.locator('#btn-next').boundingBox();
for (let i = 0; i < 10; i++) {
  await m.touchscreen.tap(nb.x + nb.width / 2, nb.y + nb.height / 2);
}
const endN = parseInt((await m.textContent('#counter')).split('/')[0], 10);
check('10 fast taps advance 10 items (none swallowed)', endN - startN === 10,
  `${startN} -> ${endN}`);
check('page did not zoom after fast tapping',
  (await m.evaluate(() => (window.visualViewport ? window.visualViewport.scale : 1))) === 1,
  String(await m.evaluate(() => (window.visualViewport ? window.visualViewport.scale : 1))));
check('no mobile JS errors', merrors.length === 0, merrors.join(' | '));

await m.screenshot({ path: join(root, 'test', 'shot-practice.png') });
await m.click('#btn-exit');
await m.screenshot({ path: join(root, 'test', 'shot-home.png'), fullPage: true });

await mctx.close();
await browser.close();

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
