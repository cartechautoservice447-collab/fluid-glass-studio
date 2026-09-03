(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const STYLE_ID = "pomodoro-study-minimize-style-v1";
  const INSTALLED_ATTR = "data-study-minimize-installed";

  const addStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .pomodoro-study-minimize-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        flex: 0 0 auto;
        border: 1px solid rgb(255 255 255 / 12%);
        border-radius: 9999px;
        background: rgb(255 255 255 / 5%);
        color: inherit;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
      }
      .pomodoro-study-minimize-toggle:hover {
        background: rgb(255 255 255 / 10%);
      }
      .pomodoro-study-minimized-shell {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        width: 100%;
        padding: 18px 0 4px;
      }
      .pomodoro-study-minimized-time {
        font-size: clamp(4rem, 10vw, 6rem);
        font-weight: 600;
        line-height: 1;
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.05em;
      }
    `;
    document.head.appendChild(style);
  };

  const findStudyCard = (dialog: HTMLElement) => {
    return Array.from(dialog.querySelectorAll<HTMLElement>("div")).find((element) => {
      if (element.querySelector(".pomodoro-study-minimize-toggle")) return false;
      return Array.from(element.querySelectorAll("p")).some((node) => node.textContent?.trim() === "Current Study Session");
    }) ?? null;
  };

  const install = (dialog: HTMLElement) => {
    if (dialog.getAttribute(INSTALLED_ATTR) === "true") return;

    const studyCard = findStudyCard(dialog);
    const timer = dialog.querySelector<HTMLElement>(".text-7xl");
    if (!studyCard || !timer) return;

    const titleLabel = Array.from(studyCard.querySelectorAll<HTMLElement>("p")).find(
      (node) => node.textContent?.trim() === "Current Study Session",
    );
    const cardHeader = titleLabel?.parentElement?.parentElement;
    if (!cardHeader) return;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "pomodoro-study-minimize-toggle";
    toggle.textContent = "−";
    toggle.title = "Minimize to timer";
    toggle.setAttribute("aria-label", "Minimize to timer");
    cardHeader.appendChild(toggle);

    const timerBlock = timer.parentElement;
    const controlsBlock = timerBlock?.nextElementSibling;
    if (!(timerBlock instanceof HTMLElement) || !(controlsBlock instanceof HTMLElement)) return;

    const hiddenElements: HTMLElement[] = [];
    const rememberHide = (element: Element | null) => {
      if (!(element instanceof HTMLElement)) return;
      if (element === timerBlock || element === controlsBlock) return;
      if (element === hiddenElements[0]) return;
      hiddenElements.push(element);
    };

    const relative = timer.closest("div.relative");
    if (relative instanceof HTMLElement) {
      for (const child of Array.from(relative.children)) {
        if (child instanceof HTMLElement && child !== timerBlock && child !== controlsBlock) rememberHide(child);
      }
    }

    const minimizedShell = document.createElement("div");
    minimizedShell.className = "pomodoro-study-minimized-shell";
    minimizedShell.style.display = "none";

    const minimizedTime = document.createElement("div");
    minimizedTime.className = "pomodoro-study-minimized-time";
    minimizedTime.textContent = timer.textContent?.trim() || "00:00";

    const restore = document.createElement("button");
    restore.type = "button";
    restore.className = "pomodoro-study-minimize-toggle";
    restore.textContent = "+";
    restore.title = "Restore Study Session";
    restore.setAttribute("aria-label", "Restore Study Session");

    minimizedShell.append(minimizedTime, restore);
    timerBlock.parentElement?.insertBefore(minimizedShell, timerBlock);

    let syncId: number | null = null;
    let minimized = false;

    const setMinimized = (next: boolean) => {
      minimized = next;
      hiddenElements.forEach((element) => {
        element.style.display = next ? "none" : "";
      });

      if (next) {
        timerBlock.style.display = "none";
        controlsBlock.style.display = "none";
        minimizedShell.style.display = "flex";
        toggle.style.display = "none";
        if (syncId !== null) window.clearInterval(syncId);
        syncId = window.setInterval(() => {
          minimizedTime.textContent = timer.textContent?.trim() || minimizedTime.textContent || "00:00";
        }, 250);
      } else {
        if (syncId !== null) {
          window.clearInterval(syncId);
          syncId = null;
        }
        minimizedShell.style.display = "none";
        timerBlock.style.display = "";
        controlsBlock.style.display = "";
        toggle.style.display = "inline-flex";
      }
    };

    toggle.addEventListener("click", () => setMinimized(true));
    restore.addEventListener("click", () => setMinimized(false));
    dialog.setAttribute(INSTALLED_ATTR, "true");

    const cleanup = new MutationObserver(() => {
      if (!document.body.contains(dialog)) {
        if (syncId !== null) window.clearInterval(syncId);
        cleanup.disconnect();
      }
    });
    cleanup.observe(document.body, { childList: true, subtree: true });

    void minimized;
  };

  addStyles();
  const observer = new MutationObserver(() => {
    document.querySelectorAll<HTMLElement>('[role="dialog"]').forEach(install);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
