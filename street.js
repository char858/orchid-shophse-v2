"use strict";

const exterior = document.querySelector(".exterior");
const scene = document.querySelector("#scene");
const toggle = document.querySelector(".motion-toggle");
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
let manuallyPaused = false;
let entering = false;

function updateMotion() {
  exterior.classList.toggle("paused", manuallyPaused || motionPreference.matches);
  toggle.hidden = motionPreference.matches;
  toggle.textContent = manuallyPaused ? "Play street animation" : "Pause street animation";
}

toggle.addEventListener("click", () => {
  manuallyPaused = !manuallyPaused;
  updateMotion();
});
motionPreference.addEventListener("change", updateMotion);
updateMotion();

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(([entry]) => {
    exterior.classList.toggle("offscreen", !entry.isIntersecting);
  });
  observer.observe(exterior);
}

for (const link of document.querySelectorAll("[data-enter]")) {
  link.addEventListener("click", async event => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    if (manuallyPaused || motionPreference.matches || !scene.animate) return;

    event.preventDefault();
    if (entering) return;
    const destination = document.getElementById(link.hash.slice(1));
    if (!destination) return;
    entering = true;

    const origin = link.dataset.enter === "office" ? "66% 32%" : "66% 73%";
    const travel = scene.animate([
      { scale: 1, transformOrigin: origin },
      { scale: 1.24, transformOrigin: origin, offset: .5 },
      { scale: 2.9, transformOrigin: origin }
    ], { duration: 800, easing: "cubic-bezier(.47,.08,.54,.99)", fill: "forwards" });
    const fade = exterior.querySelector(".street-view").animate([
      { opacity: 1 },
      { opacity: 1, offset: .42 },
      { opacity: 0 }
    ], { duration: 800, fill: "forwards" });
    await travel.finished;
    if (location.hash !== link.hash) history.pushState(null, "", link.hash);
    destination.scrollIntoView({ behavior: "instant" });
    destination.focus({ preventScroll: true });
    travel.cancel();
    fade.cancel();
    entering = false;
  });
}
