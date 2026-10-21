import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement <dialog>'s modal API; the cart drawer relies on it.
// Mirror the browser: showModal opens, close() closes and fires "close".
if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}

// jsdom has no scrolling; the app scrolls to the top on navigation.
// (Function tests run in Node, where there's no window at all.)
if (typeof window !== "undefined") window.scrollTo = () => {};
