/**
 * The app scrolls inside the `[data-scroll-root]` container (the `.App`
 * div in App.jsx is `h-screen overflow-auto`), not the window, so
 * `window.scrollTo` alone does nothing. Screens that swap content in place
 * (the /qplay query, draft and versus phases, each draft round) call this
 * so the new content opens at its top instead of inheriting the previous
 * screen's scroll offset.
 */
export function scrollAppToTop() {
  const root = document.querySelector("[data-scroll-root]");
  if (root) root.scrollTop = 0;
  window.scrollTo(0, 0);
}
