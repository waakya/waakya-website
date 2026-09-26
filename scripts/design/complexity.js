// What competes for attention on the current screen (Design V3 audit).
// `main` counts inside the visible <main> only (the V2 audit's metric);
// `page` counts the whole visible page except navigation, so sticky action
// bars and side columns outside <main> are included. Both are directional.
() => {
  // Chrome still gives boxes to what sits inside a closed <details>, so folded
  // content is excluded explicitly (its <summary> stays: that is on screen).
  const folded = (el) => { const d = el.closest("details:not([open])"); return !!d && !el.closest("summary"); };
  const vis = (el) => { if (folded(el)) return false; const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.05; };
  const inFold = (el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
  const inNav = (el) => !!el.closest("nav");
  const measure = (root, skip) => {
    const all = [...root.querySelectorAll("*")].filter((el) => !skip(el) && vis(el));
    const q = (sel) => all.filter((el) => el.matches(sel));
    const leaves = all.filter((el) => el.childElementCount === 0 && el.textContent.trim());
    const actions = q("button, a[href], input:not([type=hidden]), select, textarea, [role=tab], summary");
    return {
      actions: actions.length,
      actionsInFold: actions.filter(inFold).length,
      chips: q("[data-slot=state-chip]").length,
      boxes: q("[data-slot=card], .rounded-card").length,
      metadata: leaves.filter((el) => parseFloat(getComputedStyle(el).fontSize) <= 13).length,
      words: leaves.map((e) => e.textContent).join(" ").split(/\s+/).filter(Boolean).length,
      foldWords: leaves.filter(inFold).map((e) => e.textContent).join(" ").split(/\s+/).filter(Boolean).length,
      primaries: q("button, a").filter((el) => getComputedStyle(el).backgroundColor === "rgb(53, 65, 196)").length,
    };
  };
  const main = [...document.querySelectorAll("main")].find(vis) || document.body;
  return {
    url: location.pathname,
    navChoices: [...document.querySelectorAll("nav a[href], nav summary")].filter(vis).length,
    screens: Math.round((document.documentElement.scrollHeight / innerHeight) * 10) / 10,
    main: measure(main, () => false),
    page: measure(document.body, inNav),
  };
}
