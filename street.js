"use strict";

const exterior = document.querySelector(".exterior");
const scene = document.querySelector("#scene");
const toggle = document.querySelector(".motion-toggle");
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
let manuallyPaused = false;
let entering = false;
let renderStreet = () => {};

function updateMotion() {
  exterior.classList.toggle("paused", manuallyPaused || motionPreference.matches);
  toggle.hidden = motionPreference.matches;
  toggle.textContent = manuallyPaused ? "Play street animation" : "Pause street animation";
  renderStreet();
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
    renderStreet();
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

const sceneSize = { width: 1672, height: 941 };
const carTypes = [
  { file: "sedan.webp", width: 340, wheels: [[.219, .76, .235], [.832, .76, .235]] },
  { file: "hatchback.webp", width: 302, wheels: [[.158, .788, .212], [.817, .790, .210]] },
  { file: "mpv.webp", width: 356, wheels: [[.205, .804, .198], [.833, .805, .198]] }
];
const pedestrianTypes = [
  { file: "walker-backpack.webp", frames: 24, columns: 8, height: 164, stride: 123 },
  { file: "walker-tote.webp", frames: 24, columns: 8, height: 151, stride: 111 },
  { file: "walker-messenger.webp", frames: 24, columns: 8, height: 168, stride: 130 }
];

function loadActor(actor) {
  const image = new Image();
  image.src = "./" + actor.file;
  return image.decode().then(() => ({ ...actor, image })).catch(() => null);
}

function shadow(ctx, x, y, width, height) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(width, height);
  const gradient = ctx.createRadialGradient(0, 0, .06, 0, 0, 1);
  gradient.addColorStop(0, "#100913aa");
  gradient.addColorStop(1, "#10091300");
  ctx.fillStyle = gradient;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function drawPedestrian(ctx, actor) {
  const { type, x, direction, y, distance } = actor;
  const { image, columns, frames, height, stride } = type;
  const cellWidth = image.width / columns;
  const cellHeight = image.height / Math.ceil(frames / columns);
  const width = height * cellWidth / cellHeight;
  const frame = Math.floor((distance / stride % 1) * frames);
  shadow(ctx, x, y + 1, width * .43, 8);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);
  ctx.drawImage(image, frame % columns * cellWidth, Math.floor(frame / columns) * cellHeight,
    cellWidth, cellHeight, -width / 2, -height, width, height);
  ctx.restore();
}

function drawCar(ctx, actor) {
  const { type, x, y, distance } = actor;
  const { image, width, wheels } = type;
  const height = width * image.height / image.width;
  const front = x + width;
  const roadLight = ctx.createRadialGradient(front + 5, y + 2, 0, front + 5, y + 2, 83);
  roadLight.addColorStop(0, "#ffd4a450");
  roadLight.addColorStop(1, "#ffd4a400");
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(front + 18, y + 2, 80, 10, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = roadLight;
  ctx.fillRect(front - 64, y - 8, 160, 20);
  ctx.restore();

  shadow(ctx, x + width / 2, y + 1, width * .56, 12);
  const top = y - height;
  ctx.drawImage(image, x, top, width, height);

  // Rotating the wheels by distance / radius keeps each rotation tied to speed.
  for (const [horizontal, vertical, radius] of wheels) {
    const wheelX = x + horizontal * width;
    const wheelY = top + vertical * height;
    const outerRadius = radius * height;
    ctx.save();
    ctx.translate(wheelX, wheelY);
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius * .78, 0, Math.PI * 2);
    ctx.clip();
    ctx.rotate(distance / outerRadius);
    ctx.drawImage(image, x - wheelX, top - wheelY, width, height);
    ctx.restore();
  }
}

function startStreet(cars, people) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.className = "street-actors";
  canvas.setAttribute("aria-hidden", "true");
  scene.querySelector(".facade").after(canvas);

  let nextCar = 0;
  let nextPerson = 0;
  let timeUntilCar = 4.3;
  let timeUntilPerson = 5.7;
  let nextDirection = 1;
  let frameRequest = 0;
  let lastFrame = 0;

  function car(x, speed) {
    const type = cars[nextCar++ % cars.length];
    return { type, x, y: 922, speed, direction: 1, distance: x + type.width };
  }

  function pedestrian(x, direction, speed) {
    const type = people[nextPerson++ % people.length];
    return { type, x, y: direction > 0 ? 847 : 827, speed, direction, distance: 0 };
  }

  let traffic = cars.length ? [car(690, 335)] : [];
  let walkers = people.length ? [pedestrian(513, 1, 122), pedestrian(1260, -1, 113)] : [];

  function paint() {
    const { width, height } = sceneSize;
    const density = Math.min(devicePixelRatio || 1, 1.65);
    const pixelWidth = Math.max(1, Math.round(scene.offsetWidth * density));
    const pixelHeight = Math.max(1, Math.round(scene.offsetHeight * density));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    ctx.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
    ctx.clearRect(0, 0, width, height);
    for (const actor of [...walkers].sort((a, b) => a.y - b.y)) drawPedestrian(ctx, actor);
    for (const actor of traffic) drawCar(ctx, actor);
  }

  function advance(dt) {
    timeUntilCar -= dt;
    timeUntilPerson -= dt;
    if (cars.length && timeUntilCar <= 0) {
      traffic.push(car(-440, 290 + Math.random() * 45));
      timeUntilCar = 4.5 + Math.random() * 2.3;
    }
    if (people.length && timeUntilPerson <= 0) {
      walkers.push(pedestrian(nextDirection > 0 ? -115 : 1787, nextDirection, 106 + Math.random() * 25));
      nextDirection *= -1;
      timeUntilPerson = 5.9 + Math.random() * 3.3;
    }
    for (const actor of [...traffic, ...walkers]) {
      const step = actor.speed * dt;
      actor.x += step * actor.direction;
      actor.distance += step;
    }
    traffic = traffic.filter(actor => actor.x < sceneSize.width + 100);
    walkers = walkers.filter(actor => actor.x > -135 && actor.x < sceneSize.width + 135);
  }

  function shouldAnimate() {
    return !manuallyPaused && !motionPreference.matches && !exterior.classList.contains("offscreen") && !document.hidden;
  }

  function tick(time) {
    frameRequest = 0;
    if (!shouldAnimate()) return;
    if (lastFrame) advance(Math.min((time - lastFrame) / 1000, .05));
    lastFrame = time;
    paint();
    frameRequest = requestAnimationFrame(tick);
  }

  renderStreet = () => {
    paint();
    if (shouldAnimate()) {
      if (!frameRequest) {
        lastFrame = 0;
        frameRequest = requestAnimationFrame(tick);
      }
    } else {
      cancelAnimationFrame(frameRequest);
      frameRequest = 0;
      lastFrame = 0;
    }
  };
  addEventListener("resize", renderStreet, { passive: true });
  document.addEventListener("visibilitychange", renderStreet);
  renderStreet();
}

Promise.all([Promise.all(carTypes.map(loadActor)), Promise.all(pedestrianTypes.map(loadActor))])
  .then(([cars, people]) => startStreet(cars.filter(Boolean), people.filter(Boolean)));
