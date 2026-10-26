/* LAB portfolio controls. Portfolio prose is currently Slovenian only. */
"use strict";
(() => {
  const root = document.documentElement;
  const bar = document.querySelector("[data-ai8-toolbar]");
  if (!bar) return;
  const read = (key) => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, String(value)); } catch (_) {} };
  let theme = read("mdlxdcc-theme") === "light" ? "light" : "dark";
  const stored = Number(read("mdlxdcc-font"));
  let scale = Number.isFinite(stored) && stored >= .8 && stored <= 1.5 ? stored : 1;

  function apply() {
    root.lang = "sl";
    root.dataset.theme = theme;
    root.style.setProperty("--scale", String(scale));
    bar.querySelectorAll("[data-ai8-theme]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.ai8Theme === theme));
    });
    bar.querySelector("[data-ai8-reset]").textContent = `${Math.round(scale * 100)}%`;
    bar.querySelector("[data-ai8-down]").disabled = scale <= .8;
    bar.querySelector("[data-ai8-up]").disabled = scale >= 1.5;
  }
  bar.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button || !bar.contains(button) || button.disabled) return;
    if (button.dataset.ai8Theme) {
      theme = button.dataset.ai8Theme;
      write("mdlxdcc-theme", theme);
    } else if (button.hasAttribute("data-ai8-down")) {
      scale = Math.max(.8, Math.round((scale - .05) * 100) / 100);
      write("mdlxdcc-font", scale);
    } else if (button.hasAttribute("data-ai8-up")) {
      scale = Math.min(1.5, Math.round((scale + .05) * 100) / 100);
      write("mdlxdcc-font", scale);
    } else if (button.hasAttribute("data-ai8-reset")) {
      scale = 1;
      write("mdlxdcc-font", scale);
    }
    apply();
  });
  window.addEventListener("storage", event => {
    if (event.key && !["mdlxdcc-theme", "mdlxdcc-font"].includes(event.key)) return;
    theme = read("mdlxdcc-theme") === "light" ? "light" : "dark";
    const next = Number(read("mdlxdcc-font"));
    scale = Number.isFinite(next) && next >= .8 && next <= 1.5 ? next : 1;
    apply();
  });
  apply();
})();
