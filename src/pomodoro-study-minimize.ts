(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const STYLE_ID = "pomodoro-study-minimize-style-v2";
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
      .pomodoro-study-minimize-toggle:hover { background: rgb(255 255 255 / 10%); }
      .pomodoro-study-restore {
        display: none;
        width: 26px;
        height: 26px;
        align-items: center;
        justify-content: center;
        margin: 0 auto 8px;
        border: 1px solid rgb(255 255 255 / 12%);
        border-radius: 9999px;
        background: rgb(255 255 255 / 5%);
        color: inherit;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
      }
      .pomodoro-study-restore:hover { background: rgb(255 255 255 / 10%); }
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
    const timerBlock = timer.parentElement;
    const controlsBlock = timerBlock?.nextElementSibling;
    const contentRoot = timer.closest("div.relative");
    if (!(cardHeader instanceof HTMLElement) || !(timerBlock instanceof HTMLElement) || !(controlsBlock instanceof HTMLElement) || !(contentRoot instanceof HTMLElement)) return;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "pomodoro-study-minimize-toggle";
    toggle.textContent = "−";
    toggle.title = "Minimize to timer";
    toggle.setAttribute("aria-label", "Minimize to timer");
    cardHeader.appendChild(toggle);

    const restore = document.createElement("button");
    restore.type = "button";
    restore.className = "pomodoro-study-restore";
    restore.textContent = "+";
    restore.title = "Restore Study Session";
    restore.setAttribute("aria-label", "Restore Study Session");
    timerBlock.parentElement?.insertBefore(restore, timerBlock);

    const header = cardHeader.closest("div.relative")?.firstElementChild;
    const directChildren = Array.from(contentRoot.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
    const hiddenElements = directChildren.filter((element) => element !== timerBlock && element !== controlsBlock && element !== header && element !== restore);

    const setMinimized = (next: boolean) => {
      hiddenElements.forEach((element) => { element.style.display = next ? "none" : ""; });
      studyCard.style.display = next ? "none" : "";
      toggle.style.display = next ? "none" : "inline-flex";
      restore.style.display = next ? "flex" : "none";
    };

    toggle.addEventListener("click", () => setMinimized(true));
    restore.addEventListener("click", () => setMinimized(false));
    dialog.setAttribute(INSTALLED_ATTR, "true");

    const cleanup = new MutationObserver(() => {
      if (!document.body.contains(dialog)) cleanup.disconnect();
    });
    cleanup.observe(document.body, { childList: true, subtree: true });
  };

  addStyles();
  const observer = new MutationObserver(() => {
    document.querySelectorAll<HTMLElement>('[role="dialog"]').forEach(install);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
