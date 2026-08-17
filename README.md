# Mantra Practice

A quiet, guided way to practise reading, chanting and writing mantras.
Instead of staring at a long paragraph, the app shows you **one character**
(writing mode) or **one phrase** (chanting mode) at a time.

No build step. No server. No accounts. No data leaves your browser.

---

## Run it

**Locally** — download or clone this folder and double-click `index.html`.
That's it. It works over `file://` (this is tested, see below).

**On the web** — GitHub Pages:

1. Push this folder to a GitHub repository.
2. Repo → **Settings** → **Pages**.
3. Source: *Deploy from a branch* → branch `main`, folder `/ (root)` → **Save**.
4. Wait ~1 minute. Your URL: `https://<your-username>.github.io/<repo-name>/`

Share that URL with family — it works on phones.

---

## How to use it

| Step | What to do |
|---|---|
| 1 | Pick a text from the dropdown, or paste your own into the text box |
| 2 | Check the **preview** — it shows the first few items exactly as they will appear, so you can see what each mode does |
| 3 | Choose **Writing** (one character) or **Speaking / Chanting** (one phrase) |
| 4 | Choose **Automatic** (timer) or **Manual** (you press Next) |
| 5 | Turn on **Hán-Việt** / **Pinyin** if you want the reading under each item |
| 6 | Set **Repeat** to recite more than once (e.g. 108), and **Text size** to taste |
| 7 | **Start Practice** |

If you stopped part-way through last time, a **Resume** banner appears at the top
with your position. It survives closing the browser.

### On the practice screen

| Input | Action |
|---|---|
| `←` / `→` buttons, or arrow keys | Previous / next |
| `Space` | Pause / resume (automatic) · next (manual) |
| `Esc` | Exit to home |
| Tap **left third** of the screen | Previous |
| Tap **right third** of the screen | Next |
| Tap **centre** | Pause / resume (automatic) · next (manual) |
| Tap the **counter**, or press `O` | Open the overview — the whole text, one row per line, current item highlighted. Tap any item to jump straight to it. |

---

## Files

```
index.html      one page, three screens toggled with a CSS class
style.css       calm/minimal styling, light + dark
js/data.js      built-in texts, speed values          ← edit content here
js/segment.js   text → practice items                 ← edit segmentation here
js/engine.js    state machine + timer (no DOM at all)
js/readings.js  GENERATED hán-việt + pinyin + jyutping table (10,545 chars)
js/reading.js   readings for a text, with override table
js/i18n.js      interface strings for the four languages
js/speech.js    text-to-speech via the browser's own voices
js/media.js     .vtt/.srt parsing for follow-along playback
js/store.js     localStorage — resume position and settings
js/ui.js        all DOM code
test/unit.mjs         pure-logic + content-integrity tests, zero dependencies
test/lint-content.mjs suspected conversion artifacts, zero dependencies
test/e2e.mjs          real-browser tests (needs Playwright)
```

The three layers are deliberately separate: `engine.js` never touches the
document, and `segment.js` never knows a screen exists. You can drive the whole
engine from the browser console:

```js
var e = new Mantra.Engine(['觀','世','音'], { intervalMs: 1000, auto: true });
e.onChange = console.log;
e.start();
```

### Why plain `<script>` tags and a `.js` data file?

Both `fetch()` and `<script type="module">` are blocked by the browser on
`file://`. A `data/mantras.json` loaded with `fetch` would work on GitHub Pages
and silently show an empty app when you open `index.html` locally. So: classic
scripts, and content lives in `js/data.js` as plain JavaScript.

---

## Customising

**Add a text** — append an entry to `window.Mantra.TEXTS` in `js/data.js`:

```js
{ id: 'my-text', name: 'Display name', language: 'zh', type: 'mantra', text: '…' }
```

**Change the pacing** — `window.Mantra.SPEEDS` in `js/data.js`. Milliseconds per
item. The current values are guesses; change them after your first real session.

**Fix a reading** — `OVERRIDES` in `js/reading.js`. Readings are looked up per
character, but some Buddhist compounds are chanted differently: 南無 is *nam mô*,
not the character-by-character *nam vô*. Overrides are matched across the whole
text, so 無 still reads *mô* when writing mode shows it on its own.

**Change how phrases are split** — `segmentChanting()` in `js/segment.js`. It
breaks on punctuation, spaces and line breaks, then chops anything longer than
**16** characters into ~8-character pieces.

**Whatever spacing your text already has IS the phrasing.** The person who wrote
it down knew where the breaths go, so the splitter never overrides them — the
16-character limit sits above every real phrase in the built-in texts (千字文 4,
21 Taras 7, Manjushri 9, 楞嚴咒 up to 13). Chunking is only a fallback for a
paste with no phrasing at all. An earlier 8-character limit would have split
every Manjushri line into 5+4 and cut 陀突嚧迦建咄嚧吉知婆路多毗 in half.

No dictionary, no NLP, on purpose. Nothing else in the app knows how items are
made, so this function is safe to replace.

**Long phrases wrap.** Past 9 characters an item is laid out on two lines so the
type stays large — a 13-character phrase renders at 46px on a phone instead of
25px. See `WRAP_ABOVE` in `js/ui.js`.

---

## A note on content

Everything in `js/data.js` is either a short, widely-known invocation or a text
the repository owner supplied and verified. Nothing was reproduced from memory.

| Text | Chant items | Characters | Source |
|---|---|---|---|
| 南無觀世音菩薩 / 南無阿彌陀佛 / 南無本師釋迦牟尼佛 / 唵嘛呢叭咪吽 | 1 each | 6–9 | short invocations |
| 文殊菩薩祈請文 · Manjushri, 13 verses | 52 | 468 | user-supplied (YouTube `1UvewDv0X2A`) |
| 二十一度母讚 · 21 Taras | 84 | 588 | user-supplied, 15 conversion errors corrected |
| 楞嚴咒 · Śūraṅgama Mantra | 455 | 2,619 | user-supplied WebVTT caption track |
| 千字文 opening | — | 30 | writing practice |

Full sutras that were *not* supplied — the Heart Sutra, the Great Compassion
Mantra — are deliberately **not** included, because reproducing a sacred text
from memory risks getting it wrong.

### Conversion artifacts in 二十一度母讚 — corrected

The 21 Taras text arrived having been through a simplified→traditional converter
that picked the wrong traditional character 15 times. All 15 are fixed in
`js/data.js`, and the change is documented in a comment right above the text:

| Was | Now | × | Why |
|---|---|---|---|
| 麵 | 面 | 4 | 麵 is *noodles*; 面 is *face* — 蓮花**面** "lotus face" |
| 儘 | 盡 | 5 | 儘 is *to the utmost*; 盡 is *exhaust, entirely* |
| 噁 | 惡 | 3 | 噁 is *nausea*; 惡 is *evil* |
| 髮 | 發 | 2 | 髮 is *hair*; 發 is *to emit* — 口**發** "the mouth emits" |
| 佈 | 布 | 1 | 佈 is *announce*; 布 is *spread out* |

Nothing else was touched — character count is still 588, all 84 lines still 7
characters. 鬥 in 鬥爭 is correct traditional and was left alone. `test/unit.mjs`
asserts each correction; `test/lint-content.mjs` now reports a clean bill.

No artifacts were found in 楞嚴咒 or 文殊菩薩祈請文.

To add a text: verify it against a source you trust, then paste it into the text
box or add it to `js/data.js`.

---

## Tests

**Unit tests** — no install needed:

```bash
node test/unit.mjs
```

Covers segmentation (including non-BMP characters, punctuation-only input,
long unpunctuated runs), the engine (pause/resume accuracy, boundaries, timer
cleanup), and the integrity of every built-in text (line counts, character
counts, first/last line).

**Content linter** — no install needed:

```bash
node test/lint-content.mjs
```

Reports suspected simplified→traditional conversion artifacts. Never edits
anything. Exits 0 always — it is a report, not a test.

**End-to-end tests** — needs Playwright once:

```bash
npm install --no-save playwright && npx playwright install chromium
node test/e2e.mjs
```

Drives a real Chromium over `file://` through every item in the V0 definition of
done, plus resume, the overview map, the pronunciation line, deep links, and a
390×844 mobile pass with real touch taps — including a check that ten fast taps
on Next advance ten items and do not trigger iOS double-tap zoom.

Last run on this machine: **143 unit + 175 e2e, 0 failures.**

---

## Interface languages

English · Tiếng Việt · 繁體中文 · 简体中文. Picked automatically from your browser
on first visit, changeable in the top-right, and remembered.

**Only the interface is translated.** The practice texts are never translated or
script-converted. Automatic simplified↔traditional conversion is exactly what put
蓮花**麵** — "lotus noodles" — into 二十一度母讚, so the app will not do it to a
sacred text.

---

## Pronunciation

Turn on **Hán-Việt**, **Pinyin** and/or **Cantonese** on the home screen to show
the reading under each item. All three can be shown at once.

| | Source | Coverage on the built-in texts |
|---|---|---|
| Hán-Việt | [`hanviet-pinyin-words`](https://www.npmjs.com/package/hanviet-pinyin-words) v2.1.7, MIT, © 2024 Phong Phan | 98–100% |
| Pinyin | Unicode Unihan `kMandarin` | 100% |
| Cantonese (Jyutping) | Unicode Unihan `kCantonese` | ~100% |

The Hán-Việt table is keyed by pinyin, so polyphones resolve correctly. A
character with no known reading shows `·` — in practice this is only 𤙖 (U+24656)
in 楞嚴咒, which has no Hán-Việt or Cantonese entry in either source. Nothing is
invented.

### ⚠️ Hán-Việt is per character, not a liturgical transliteration

This matters for mantras. The app gives the **standard Hán-Việt reading of each
character**. Vietnamese Buddhist liturgy uses established transcriptions that
differ systematically — and there is more than one of them: the Hán-Việt-based
recitation, and Sanskrit-based transcriptions such as Thích Tuệ Nhuận's (Hà Nội,
1949). For 楞嚴咒 the app produces *"nam mô tát đát tha tô già đa gia…"*, which is
close to the traditional recitation but is not any single lineage's authorised
text.

To use a canonical version, paste it into the text box and practise from that
directly. No transcription is generated or guessed for you.

---

## Practising along with a recording

Load an audio file **from your own device** on the home screen. Optionally load
the matching `.vtt` or `.srt` next to it (what `yt-dlp --write-auto-subs`
writes), and the app follows the recording: **one cue becomes one practice
item**, and the screen advances exactly when the reciter does. Pause, seek and
the overview map all move the audio with them.

Without timings the recording simply plays alongside your own pace.

**The file never leaves your device.** It is played through
`URL.createObjectURL`, which points the `<audio>` element at the file already on
your disk — nothing is uploaded, copied into the page, or stored on a server. A
test asserts the audio `src` is always a `blob:` URL.

### Why no recordings are bundled

This is a public site, so shipping recordings here would redistribute them to
everyone. Commercial and YouTube-sourced chanting is under copyright, and the
repository is not the place for it. Keep your audio local and load it with the
picker — that is the whole reason the picker exists.

---

## Read aloud

Optional, using your device's own speech voices — no network, no API key, no
audio files. The dropdown only lists languages your device actually has a voice
for; if it has none, the app says so instead of failing silently.

Two honest limits, stated in the app itself:

- It reads **modern pronunciation**. A transliterated mantra like 楞嚴咒 was
  written to carry Sanskrit sounds; a Mandarin voice reading it is a rough guide,
  not correct recitation. For real recitation, load a recording (above).
- The **Vietnamese** voice is given the Hán-Việt romanisation, not the Chinese
  characters — a Vietnamese voice handed 敬禮迅捷勇度母 produces silence. English
  is not offered at all: it has nothing sensible to say about either form.
- Voice quality and availability are entirely the device's. Cantonese (`yue-HK`)
  and Vietnamese are common on iOS/macOS, patchy elsewhere.

`js/readings.js` is generated. To rebuild it, download
`https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip` and
`npm pack hanviet-pinyin-words`, then merge `kMandarin` and `kCantonese` with the
package's `hanvietData.js`, preferring a toned pinyin reading over the
neutral-tone particle reading (this is what fixes 地 *de* → *dì*). Each entry is
`char → [hán-việt, pinyin, jyutping]`.

---

## Known limits (V0)

- Wake Lock keeps the screen awake in automatic mode where the browser supports
  it; browsers without `navigator.wakeLock` will still sleep.
- Progress and settings are saved in `localStorage`, which some browsers block
  in private mode or over `file://`. The app then simply stops remembering.
- Chanting segmentation is mechanical, not linguistic. It follows the spacing
  your text already has; a paste with no spacing at all gets chopped every ~8
  characters, which will sometimes land in an odd place.
- 楞嚴咒 in writing mode is 2,619 characters — about 1 hour 50 minutes at the
  Normal speed. Use ← → to pick up where you stopped; nothing is saved.
- No audio, no handwriting canvas, no stroke order, no progress history.
