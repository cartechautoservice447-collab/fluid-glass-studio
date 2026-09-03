(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const STYLE_ID = "pomodoro-study-minimize-style-v3";
  const INSTALLED_ATTR = "data-study-minimize-installed-v3";

  const addStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .pomodoro-study-minimize-toggle {
        display: inline-flex;
        width: 28px;
        height: 28px;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        border: 1px solid rgb(255 255 255 / 16%);
        border-radius: 9999px;
        background: rgb(255 255 255 / 6%);
        color: inherit;
        cursor: pointer;
        font-size: 17px;
        font-weight: 600;
        line-height: 1;
      }
      .pomodoro-study-minimize-toggle:hover { background: rgb(255 255 255 / 12%); }
      .pomodoro-study-restore {
        display: none;
        width: 28px;
        height: 28px;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        margin: 0 auto 10px;
        border: 1px solid rgb(255 255 255 / 16%);
        border-radius: 9999px;
        background: rgb(255 255 255 / 6%);
        color: inherit;
        cursor: pointer;
        font-size: 17px;
        font-weight: 600;
        line-height: 1;
      }
      .pomodoro-study-restore:hover { background: rgb(255 255 255 / 12%); }
    `;
    document.head.appendChild(style);
  };

  const exactText = (element: Element, text: string) => element.textContent?.trim() === text;

  const findStudyCard = (dialog: HTMLElement) => {
    const label = Array.from(dialog.querySelectorAll<HTMLElement>("p,span,div"))
      .find((element) => exactText(element, "Current Study Session"));
    if (!label) return null;

    let candidate: HTMLElement | null = label instanceof HTMLElement ? label : label.parentElement;
    for (let depth = 0; candidate && depth < 6; depth += 1) {
      const hasSchedule = candidate.querySelectorAll('[class*="rounded-xl"]').length >= 2;
      const hasSessionTitle = Array.from(candidate.querySelectorAll("p,span,div"))
        .some((element) => exactText(element, "Deep Study") || exactText(element, "Balanced Study") || exactText(element, "Classic Study"));
      if (hasSchedule || hasSessionTitle) return candidate;
      candidate = candidate.parentElement;
    }

    return label.parentElement?.parentElement instanceof HTMLElement ? label.parentElement.parentElement : null;
  };

  const install = (dialog: HTMLElement) => {
    if (dialog.getAttribute(INSTALLED_ATTR) === "true") return;

    const studyCard = findStudyCard(dialog);
    const timer = dialog.querySelector<HTMLElement>(".text-7xl");
    if (!studyCard || !timer) return;

    const label = Array.from(studyCard.querySelectorAll<HTMLElement>("p,span,div"))
      .find((element) => exactText(element, "Current Study Session"));
    if (!label) return;

    const header = label.parentElement;
    if (!(header instanceof HTMLElement)) return;

    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    header.style.gap = "10px";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "pomodoro-study-minimize-toggle";
    toggle.textContent = "−";
    toggle.title = "Minimize Current Study Session";
    toggle.setAttribute("aria-label", "Minimize Current Study Session");
    header.appendChild(toggle);

    const restore = document.createElement("button");
    restore.type = "button";
    restore.className = "pomodoro-study-restore";
    restore.textContent = "+";
    restore.title = "Restore Current Study Session";
    restore.setAttribute("aria-label", "Restore Current Study Session");

    const timerBlock = timer.parentElement;
    if (!(timerBlock instanceof HTMLElement)) return;
    timerBlock.parentElement?.insertBefore(restore, timerBlock);

    const setMinimized = (next: boolean) => {
      studyCard.style.display = next ? "none" : "";
      toggle.style.display = next ? "none" : "inline-flex";
      restore.style.display = next ? "flex" : "none";
      if (!next) return;
      timer.scrollIntoView({ block: "nearest" });
    };

    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setMinimized(true);
    });

    restore.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setMinimized(false);
    });

    dialog.setAttribute(INSTALLED_ATTR, "true");
  };

  addStyles();

  const observer = new MutationObserver(() => {
    document.querySelectorAll<HTMLElement>('[role="dialog"]').forEach(install);
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
