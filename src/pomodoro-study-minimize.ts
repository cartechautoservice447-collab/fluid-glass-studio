(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const STYLE_ID = "pomodoro-study-minimize-style-v4";
  const INSTALLED_ATTR = "data-study-minimize-installed-v4";

  const addStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .pomodoro-study-minimize-toggle {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 30;
        display: inline-flex;
        width: 28px;
        height: 28px;
        align-items: center;
        justify-content: center;
        border: 1px solid rgb(255 255 255 / 20%);
        border-radius: 9999px;
        background: rgb(15 15 15 / 78%);
        color: inherit;
        cursor: pointer;
        font-size: 17px;
        font-weight: 700;
        line-height: 1;
        box-shadow: 0 4px 14px rgb(0 0 0 / 30%);
      }
      .pomodoro-study-minimize-toggle:hover { background: rgb(255 255 255 / 14%); }
      .pomodoro-study-restore {
        display: none;
        width: 28px;
        height: 28px;
        align-items: center;
        justify-content: center;
        margin: 0 auto 10px;
        border: 1px solid rgb(255 255 255 / 20%);
        border-radius: 9999px;
        background: rgb(15 15 15 / 78%);
        color: inherit;
        cursor: pointer;
        font-size: 17px;
        font-weight: 700;
        line-height: 1;
        box-shadow: 0 4px 14px rgb(0 0 0 / 30%);
      }
      .pomodoro-study-restore:hover { background: rgb(255 255 255 / 14%); }
    `;
    document.head.appendChild(style);
  };

  const exactText = (element: Element, text: string) => element.textContent?.trim() === text;

  const findLabel = (dialog: HTMLElement) =>
    Array.from(dialog.querySelectorAll<HTMLElement>("p,span,div"))
      .find((element) => exactText(element, "Current Study Session")) ?? null;

  const findStudyCard = (label: HTMLElement) => {
    let candidate: HTMLElement | null = label;
    for (let depth = 0; candidate && depth < 8; depth += 1) {
      const hasSessionTitle = Array.from(candidate.querySelectorAll("p,span,div")).some((element) =>
        ["Deep Study", "Balanced Study", "Classic Study"].includes(element.textContent?.trim() ?? ""),
      );
      const hasScheduleRow = Array.from(candidate.querySelectorAll("p,span,div")).some((element) =>
        ["NOW", "NEXT", "DONE"].includes(element.textContent?.trim() ?? ""),
      );
      if (hasSessionTitle || hasScheduleRow) return candidate;
      candidate = candidate.parentElement;
    }
    return label.parentElement?.parentElement instanceof HTMLElement ? label.parentElement.parentElement : null;
  };

  const install = (dialog: HTMLElement) => {
    if (dialog.getAttribute(INSTALLED_ATTR) === "true") return;

    const label = findLabel(dialog);
    if (!label) return;
    const studyCard = findStudyCard(label);
    const timer = dialog.querySelector<HTMLElement>(".text-7xl");
    if (!studyCard || !timer) return;

    studyCard.style.position = "relative";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "pomodoro-study-minimize-toggle";
    toggle.textContent = "−";
    toggle.title = "Minimize Current Study Session";
    toggle.setAttribute("aria-label", "Minimize Current Study Session");
    studyCard.appendChild(toggle);

    const timerContainer = timer.parentElement?.parentElement;
    if (!(timerContainer instanceof HTMLElement)) return;

    const restore = document.createElement("button");
    restore.type = "button";
    restore.className = "pomodoro-study-restore";
    restore.textContent = "+";
    restore.title = "Restore Current Study Session";
    restore.setAttribute("aria-label", "Restore Current Study Session");
    timerContainer.insertBefore(restore, timerContainer.firstChild);

    const setMinimized = (next: boolean) => {
      studyCard.style.display = next ? "none" : "";
      toggle.style.display = next ? "none" : "inline-flex";
      restore.style.display = next ? "flex" : "none";
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
