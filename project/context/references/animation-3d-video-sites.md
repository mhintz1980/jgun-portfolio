name: animated-3d-video-sites
description: Build high-end, animated 3D landing pages using AI video background layers, CSS 3D transforms, GSAP ScrollTrigger choreography, and lightweight Three.js canvases.
---

### Architecture & Tech Stack Rules
- **Core Stack:** Plain semantic HTML5, modern CSS, vanilla JavaScript, GSAP with [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/), and optional Three.js (`BufferGeometry`).
- **Development Order:** Asset-driven development. Generate and optimize video/visual media *before* writing DOM layouts. Color palettes and contrast rules derive from the hero video asset.

### 1. Hero Video Background Layering Pattern
Always structure background video containers using explicit z-index layering to preserve high text contrast:

```html
<section class="hero relative overflow-hidden min-h-screen flex items-center justify-center">
  <video class="hero-video absolute inset-0 w-full h-full object-cover z-0" 
         autoplay muted loop playsinline preload="auto" poster="hero-poster.jpg">
    <source src="hero.mp4" type="video/mp4">
    <source src="hero.webm" type="video/webm">
  </video>
  <!-- Dark Contrast Overlay Layer -->
  <div class="hero-overlay absolute inset-0 bg-slate-950/60 z-10"></div>
  <!-- Interactive Canvas Layer (Optional Three.js) -->
  <canvas class="hero-canvas absolute inset-0 pointer-events-none z-20"></canvas>
  <!-- Foreground DOM Content -->
  <div class="hero-content relative z-30 max-w-5xl mx-auto px-6 text-white text-center">
    <!-- Headline, CTA, Badges -->
  </div>
</section>

```

### 2. GSAP ScrollTrigger & Pinned Scrub Patterns

* **Staggered Card Animations:**
```javascript
gsap.from(".feature-card", {
  scrollTrigger: {
    trigger: ".features-section",
    start: "top 80%",
  },
  y: 40,
  opacity: 0,
  duration: 0.7,
  stagger: 0.15,
  ease: "power2.out"
});

```


* **Pinned Sequence Scrubbing:**
```javascript
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".demo-section",
    start: "top top",
    end: "+=3000", // Pinned for 300vh scroll
    scrub: 1,
    pin: true,
    anticipatePin: 1
  }
});
tl.from(".demo-step-1", { opacity: 0, scale: 0.95, duration: 1 })
  .from(".demo-step-2", { opacity: 0, x: 50, duration: 1 }, "+=0.5")
  .from(".demo-step-3", { opacity: 0, y: 30, duration: 1 }, "+=0.5");

```



### 3. CSS 3D Transforms & Dynamic Mouse Tilt

* Implement 3D perspective tilts without heavy physics engines:
```javascript
const card = document.querySelector(".tilt-card");
card.addEventListener("mousemove", (e) => {
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  const rotateX = -(y / (rect.height / 2)) * 12; // Max 12 deg
  const rotateY = (x / (rect.width / 2)) * 12;
  card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
});
card.addEventListener("mouseleave", () => {
  card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
});

```



### 4. Accessibility & Performance Guardrails

* **Hardware Acceleration:** Apply `will-change: transform, opacity;` to scrubbed and tilted nodes.
* **Mobile Fallback:** Disable WebGL canvases and heavy video loops on touch/mobile devices or low-bandwidth connections, substituting a static poster image.
* **Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  .hero-video { display: none; }
  .hero { background-image: url('hero-poster.jpg'); background-size: cover; }
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}

```



```

---

**Installation Command**

```bash
mkdir -p .claude/skills/animated-3d-video-sites

```