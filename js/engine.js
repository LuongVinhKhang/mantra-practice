/* Mantra Practice — the practice engine.
 *
 * Knows nothing about the DOM. Give it items and a config, listen to onChange.
 * You can drive the whole thing from the console:
 *
 *   var e = new Mantra.Engine(['a','b'], {intervalMs: 1000, auto: true});
 *   e.onChange = console.log; e.start();
 */
(function (M) {
  'use strict';

  /* setTimeout, not setInterval: setInterval drifts and cannot be paused
   * accurately. We track how much of the current interval is left so
   * pause → resume continues from exactly where it stopped. */
  function now() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  function Engine(items, config) {
    config = config || {};
    this.items = (items || []).slice();
    this.intervalMs = config.intervalMs || 2500;
    this.auto = config.auto !== false;   // manual mode = auto:false
    this.index = 0;
    this.playing = false;
    this.finished = false;
    this.onChange = config.onChange || function () {};

    this._timer = null;
    this._armedAt = 0;
    this._armedFor = 0;
    this._remaining = null;
  }

  Engine.prototype._clear = function () {
    if (this._timer !== null) { clearTimeout(this._timer); this._timer = null; }
  };

  Engine.prototype._arm = function (ms) {
    var self = this;
    this._clear();
    this._armedFor = ms;
    this._armedAt = now();
    this._timer = setTimeout(function () {
      self._timer = null;
      self._remaining = null;
      self.next();
    }, ms);
  };

  Engine.prototype._emit = function () {
    this.onChange({
      item: this.items[this.index],
      index: this.index,
      total: this.items.length,
      playing: this.playing,
      finished: this.finished,
      auto: this.auto
    });
  };

  Engine.prototype._clamp = function (i) {
    if (!isFinite(i) || i < 0) return 0;
    return Math.min(Math.floor(i), Math.max(0, this.items.length - 1));
  };

  /* fromIndex lets a saved session pick up where it stopped. */
  Engine.prototype.start = function (fromIndex) {
    this.index = this._clamp(fromIndex || 0);
    this.finished = false;
    this._remaining = null;
    this.playing = false;
    this._emit();
    if (this.auto) this.play();
    return this;
  };

  /* Jump straight to an item — used by the overview map. */
  Engine.prototype.jumpTo = function (i) {
    if (this.finished) { this.finished = false; }
    this._moveTo(this._clamp(i));
    return this;
  };

  Engine.prototype.play = function () {
    if (this.finished || !this.auto || this.playing) { this._emit(); return this; }
    this.playing = true;
    this._arm(this._remaining !== null ? this._remaining : this.intervalMs);
    this._emit();
    return this;
  };

  Engine.prototype.pause = function () {
    if (!this.playing) return this;
    var elapsed = now() - this._armedAt;
    this._remaining = Math.max(0, this._armedFor - elapsed);
    this._clear();
    this.playing = false;
    this._emit();
    return this;
  };

  Engine.prototype.toggle = function () {
    return this.playing ? this.pause() : this.play();
  };

  /* Any deliberate move restarts the interval from full — you should never
   * land on a new character with 0.2s left on the clock. */
  Engine.prototype._moveTo = function (i) {
    this._remaining = null;
    this.index = i;
    if (this.playing) this._arm(this.intervalMs);
    this._emit();
  };

  Engine.prototype.next = function () {
    if (this.finished) return this;
    if (this.index >= this.items.length - 1) return this.finish();
    this._moveTo(this.index + 1);
    return this;
  };

  Engine.prototype.prev = function () {
    if (this.finished) return this;
    if (this.index <= 0) { this._moveTo(0); return this; }
    this._moveTo(this.index - 1);
    return this;
  };

  Engine.prototype.finish = function () {
    this._clear();
    this._remaining = null;
    this.playing = false;
    this.finished = true;
    this._emit();
    return this;
  };

  Engine.prototype.restart = function () {
    return this.start(0);
  };

  /* Always call this when leaving the practice screen, or the timer keeps
   * firing in the background. */
  Engine.prototype.destroy = function () {
    this._clear();
    this.playing = false;
    this.onChange = function () {};
    return this;
  };

  M.Engine = Engine;

})(window.Mantra = window.Mantra || {});
