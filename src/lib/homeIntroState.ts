// Tracks whether the homepage intro (scroll-lock, background fade-in, hero
// fade-in) has already played once this page load. Module-level state
// resets on a real refresh/first visit but survives SPA navigation away
// from and back to "/", so the intro doesn't replay every time.
let played = false;

export function hasHomeIntroPlayed(): boolean {
  return played;
}

export function markHomeIntroPlayed(): void {
  played = true;
}
