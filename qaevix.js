(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  function initWriteupDrawer() {
    const drawer = $("#writeup-drawer");
    const toggle = $("#writeup-drawer-toggle");
    if (!drawer || !toggle) return;

    let lastFocused = null;

    const setOpen = (open) => {
      drawer.classList.toggle("is-open", open);
      drawer.setAttribute("aria-hidden", String(!open));
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("writeup-drawer-open", open);

      if (open) {
        lastFocused = document.activeElement;
        requestAnimationFrame(() => $(".writeup-drawer__close", drawer)?.focus());
      } else {
        lastFocused?.focus?.();
      }
    };

    toggle.addEventListener("click", () => setOpen(!drawer.classList.contains("is-open")));
    $$('[data-drawer-close]', drawer).forEach((button) => button.addEventListener("click", () => setOpen(false)));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && drawer.classList.contains("is-open")) setOpen(false);
    });

    $$(".writeup-category", drawer).forEach((category) => {
      const button = $(":scope > button", category);
      if (!button) return;
      button.addEventListener("click", () => {
        const open = !category.classList.contains("is-open");
        category.classList.toggle("is-open", open);
        button.setAttribute("aria-expanded", String(open));
      });
    });
  }

  function renderWriteupCategory(categoryId, items = []) {
    const host = $(`[data-writeup-list="${categoryId}"]`);
    if (!host) return;

    const inner = document.createElement("div");
    inner.className = "writeup-category__inner";
    const list = document.createElement("ul");
    list.className = "writeup-list";

    if (!items.length) {
      const empty = document.createElement("li");
      empty.className = "writeup-list-empty";
      empty.textContent = "No local write-ups published yet.";
      list.append(empty);
    } else {
      items.forEach((item) => {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = item.url;
        if (item.external) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }
        const title = document.createElement("strong");
        title.textContent = item.title;
        const meta = document.createElement("small");
        meta.textContent = item.description || (item.external ? "External collection ↗" : "Read write-up →");
        link.append(title, meta);
        li.append(link);
        list.append(li);
      });
    }

    inner.append(list);
    host.replaceChildren(inner);
  }

  async function loadWriteups() {
    const categories = ["tryhackme", "hackthebox", "computer-science"];
    categories.forEach((id) => renderWriteupCategory(id, []));

    try {
      const response = await fetch(`data/writeups.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Write-ups manifest unavailable");
      const payload = await response.json();
      categories.forEach((id) => renderWriteupCategory(id, payload[id] || []));
    } catch {
      // The drawer remains usable with empty category states.
    }
  }

  function normalizeLegacyBranding() {
    const output = $("#terminal-output");
    if (!output) return;

    const rewrite = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = node.textContent
          .replaceAll("l1nux", "Qaevix")
          .replaceAll("https://github.com/Qaevix/TryHackMe-Labs", "https://github.com/Qaevix/TryHackMe");
        return;
      }
      node.childNodes?.forEach(rewrite);
    };

    const observer = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach(rewrite));
    });
    observer.observe(output, { childList: true, subtree: true });
    rewrite(output);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initWriteupDrawer();
    loadWriteups();
    normalizeLegacyBranding();
  });
})();
