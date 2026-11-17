/* Shared theme bootstrap — Tyndall-Effect.md §32.3
 *
 * Loaded as a CLASSIC, parser-blocking script in every <head>, before any
 * stylesheet. That is the whole point: it has to resolve the theme and stamp the
 * class before the first paint, or a saved-Dark visitor sees one white frame and
 * a Light visitor sees one black one. A `type="module"` script is deferred by
 * definition and would always be too late; an inline copy per page would be the
 * same logic in eight places, which is how index and About drifted apart in the
 * first place.
 *
 * ONE key for the whole site: `riTheme`, values "light" | "dark".
 *
 * Resolution order is fixed (§32.3.1):
 *   1. a valid saved value means the user chose, so honour it;
 *   2. anything else — missing, corrupt, storage blocked — is LIGHT;
 *   3. `prefers-color-scheme` is deliberately NOT consulted. Defaulting to day
 *      is a product decision, not an OS-following one.
 *
 * Everything downstream (Experience/Theme.js, About, the six case-study pages)
 * consumes what this decided; nothing else may re-derive a default.
 */
(function () {
  var KEY = "riTheme";

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      if (v === "light" || v === "dark") return v;
    } catch (e) {
      // Storage can throw outright, not just return null — Safari private mode
      // and enterprise policies both do. Falling through to the default is the
      // correct behaviour, so there is nothing to log.
    }
    return "light";
  }

  function write(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }

  function apply(v) {
    var root = document.documentElement;
    // toggle(name, force) touches ONLY this class. `is-ready`, `mnav-lock` and
    // the debug classes live on the same element and must survive.
    root.classList.toggle("light", v === "light");
    // Tells the UA which way to render form controls, scrollbars and the canvas
    // backdrop. Without it a Light page keeps dark scrollbars on some platforms.
    root.style.colorScheme = (v === "light") ? "light" : "dark";
  }

  var theme = read();
  apply(theme);

  // The shared surface. Deliberately tiny and framework-free: About uses it
  // directly, and Experience/Theme.js uses it for persistence while owning the
  // toggle UI, the "switch" event and the Three.js side.
  window.__riTheme = { KEY: KEY, read: read, write: write, apply: apply };
})();
