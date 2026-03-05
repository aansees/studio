Summary: Pixelated Image Loading Animation — Astro Project Review & Next.js Porting Guide

## How the Current Astro Project Works

This project creates a **WebGL pixelated reveal effect** on images as they scroll into view. Here's the architecture:

### Architecture Overview

```/dev/null/diagram.txt#L1-9
┌────────────────────────────────────────────────────┐
│  DOM Layer (z-index: 10) — Images are opacity: 0   │
│  ┌──────────────────────────────────────────────┐  │
│  │  <img> elements positioned in CSS grid       │  │
│  └──────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────┤
│  WebGL Layer (z-index: 0) — Fixed <canvas>         │
│  Three.js planes with custom shaders overlay each  │
│  <img>, animating uProgress 0→1 on scroll          │
└────────────────────────────────────────────────────┘
```

### Key Components

#### 1. The Fragment Shader — The Heart of the Effect

```gsap-threejs-codrops/src/app/shaders/fragment.glsl#L1-62
uniform sampler2D uTexture;
varying vec2 vUv;

uniform vec2 uResolution;
uniform float uProgress;
uniform vec3 uColor;

uniform vec2 uContainerRes;
uniform float uGridSize;

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}
```

The shader does the following:
- **Pixelates** the UV space into a grid of cells (`floor(squareUvs.x * gridSize) / gridSize`)
- Uses `uProgress` (animated 0→1) to sweep a **reveal band** vertically across the image
- Each grid cell gets a **random value** — cells near the sweep line appear/disappear with randomized timing
- Mixes between a **solid color** (`uColor: #242424`) and the **actual texture**, creating the pixelated-to-sharp transition

#### 2. Media Class — One per `<img>` element

```gsap-threejs-codrops/src/app/components/media.ts#L30-42
  constructor({ element, scene, sizes }: Props) {
    this.element = element
    this.anchorElement = this.element.closest("a") as
      | HTMLAnchorElement
      | undefined
    this.scene = scene
    this.sizes = sizes

    this.currentScroll = 0
    this.lastScroll = 0
    this.scrollSpeed = 0

    this.createGeometry()
```

Each `Media` instance:
- Creates a `PlaneGeometry(1,1)` + `ShaderMaterial` with the custom shaders
- Loads the `<img>` src as a Three.js texture
- Calculates mesh size/position to **perfectly overlay** the DOM image (maps DOM pixel coords → 3D world coords)
- Uses **GSAP ScrollTrigger** to animate `uProgress` from 0→1 when the element enters the viewport

```gsap-threejs-codrops/src/app/components/media.ts#L145-157
  observe() {
    this.scrollTrigger = gsap.to(this.material.uniforms.uProgress, {
      value: 1,
      scrollTrigger: {
        trigger: this.element,
        start: "top bottom",
        end: "bottom top",
        toggleActions: "play reset restart reset",
      },
      duration: 1.6,
      ease: "linear",
    })
  }
```

#### 3. Canvas Class — Three.js Scene Manager

```gsap-threejs-codrops/src/app/components/canvas.ts#L28-34
  constructor() {
    this.element = document.getElementById("webgl") as HTMLCanvasElement
    this.medias = []
    this.createScene()
    this.createCamera()
    this.createRenderer()
    this.setSizes()
```

- Perspective camera at `z=10`, FOV 75°
- Full-screen canvas with `alpha: true` (transparent background)
- Converts DOM pixel sizes to world units using the FOV math
- On each frame: updates scroll positions for all media, then renders

#### 4. CSS Trick — Images invisible, WebGL visible

```gsap-threejs-codrops/src/styles/index.css#L125-127
.container img {
  width: 100%;
  opacity: 0;
}
```

The real `<img>` elements are invisible. They serve as **layout anchors** — the Three.js planes are positioned exactly on top of them in WebGL space.

#### 5. Page Transitions (Barba.js + GSAP Flip)
The project uses Barba.js for SPA-like transitions with GSAP Flip for the hero image FLIP animation between home → detail pages. The `uProgress` is animated in reverse during transitions (sharp → pixelated → gone).

---

## How to Build the Same Effect in Next.js

### Step-by-Step Strategy

### 1. Project Setup & Dependencies

```/dev/null/package-commands.sh#L1-3
npm install three gsap @types/three
npm install raw-loader  # or glsl-loader for webpack
npm install fontfaceobserver
```

You'll need a way to import `.glsl` files. Options:
- **`raw-loader`** in `next.config.js` (webpack)
- **Template literals** — just inline the shader strings (simplest)
- **`@react-three/fiber`** — optional, but not needed for this approach

### 2. Next.js Config for GLSL Files

```/dev/null/next.config.js#L1-16
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.glsl$/,
      use: 'raw-loader',
    });
    return config;
  },
};

module.exports = nextConfig;
```

### 3. Architecture — React Component Structure

```/dev/null/architecture.txt#L1-14
app/
├── layout.tsx              # Root layout with <canvas id="webgl">
├── page.tsx                # Home page (image grid)
├── [index]/page.tsx        # Detail page
├── components/
│   ├── WebGLCanvas.tsx     # Client component — owns the Three.js scene
│   ├── PixelImage.tsx      # Client component — wraps each <img>
│   └── TextAnimation.tsx   # Client component — GSAP SplitText
├── lib/
│   ├── canvas.ts           # Three.js Canvas class (nearly identical)
│   ├── media.ts            # Media class (nearly identical)
│   ├── scroll.ts           # GSAP ScrollSmoother setup
│   └── shaders/
│       ├── fragment.glsl   # Copy as-is
│       └── vertex.glsl     # Copy as-is
```

### 4. The Core WebGL Component (Client-Side Only)

This is the most critical piece. The Three.js canvas **must** be client-only:

```/dev/null/components/WebGLCanvas.tsx#L1-72
'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

// Import shader source as strings
import vertexShader from '@/lib/shaders/vertex.glsl';
import fragmentShader from '@/lib/shaders/fragment.glsl';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

export default function WebGLCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    medias: Media[];
    sizes: { width: number; height: number };
  } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 1. Create scene, camera, renderer (same as canvas.ts)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 100
    );
    camera.position.z = 10;
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

    // 2. Calculate world sizes from FOV
    const fov = camera.fov * (Math.PI / 180);
    const height = camera.position.z * Math.tan(fov / 2) * 2;
    const width = height * camera.aspect;
    const sizes = { width, height };

    // 3. Create Media instances for every <img> on the page
    const images = document.querySelectorAll('img');
    const medias: Media[] = [];
    images.forEach((img) => {
      medias.push(new Media({ element: img, scene, sizes }));
    });
    medias.forEach((m) => m.observe());

    // 4. Render loop via GSAP ticker
    const render = () => {
      const scroll = /* get scroll from ScrollSmoother */ 0;
      medias.forEach((m) => m.updateScroll(scroll));
      renderer.render(scene, camera);
    };
    gsap.ticker.add(render);

    return () => {
      gsap.ticker.remove(render);
      medias.forEach((m) => m.destroy());
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} id="webgl" className="webgl-canvas" />;
}
```

### 5. The Media Class — Port Almost Directly

The `media.ts` class can be used **nearly as-is** — it's pure imperative Three.js/GSAP code. The only changes:
- Import shaders as string constants instead of via `vite-plugin-glsl`
- The `observe()` method with ScrollTrigger works the same way

### 6. The Shaders — Copy As-Is

Both `vertex.glsl` and `fragment.glsl` are standard GLSL and framework-agnostic. Copy them directly.

### 7. Root Layout — Canvas Placement

```/dev/null/app/layout.tsx#L1-24
import WebGLCanvas from '@/components/WebGLCanvas';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div id="app">
          <div id="smooth-content">
            {children}
          </div>
        </div>
        <WebGLCanvas />
      </body>
    </html>
  );
}
```

### 8. CSS — Same Approach

```/dev/null/app/globals.css#L1-14
/* Images invisible — WebGL handles the visuals */
.container img {
  width: 100%;
  opacity: 0;
}

/* Fixed canvas behind everything */
.webgl-canvas {
  position: fixed;
  z-index: 0;
  inset: 0;
  pointer-events: none;
}
```

### 9. Page Transitions — Replace Barba.js

Barba.js won't work with Next.js routing. You have several options:

| Approach | Complexity | Quality |
|----------|-----------|---------|
| **`framer-motion` layout animations** | Medium | Good FLIP-like transitions |
| **Next.js `View Transitions` API** (experimental) | Low | Native but limited |
| **Custom GSAP transition wrapper** | High | Full control, closest to original |
| **`next-view-transitions` package** | Low | Easy View Transitions polyfill |

For the FLIP animation specifically (image flying from grid → detail page), use **GSAP Flip** with a shared layout component:

```/dev/null/components/PageTransition.tsx#L1-25
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // On route change:
    // 1. Capture Flip state of active image BEFORE DOM update
    // 2. After new page renders, Flip.from() to animate
    // 3. Reverse uProgress on non-active medias (pixelate out)
    // 4. Forward uProgress on active media (ensure it's fully revealed)
  }, [pathname]);

  return <>{children}</>;
}
```

### 10. Key Gotchas & Differences

| Concern | Astro | Next.js |
|---------|-------|---------|
| **SSR** | Static HTML, script runs client-side | Must use `'use client'` for all Three.js/GSAP code |
| **GLSL imports** | `vite-plugin-glsl` | `raw-loader` in webpack config, or inline strings |
| **Page transitions** | Barba.js intercepts links | Next.js router + custom GSAP/Flip logic |
| **ScrollSmoother** | Direct DOM manipulation | Needs `useEffect` + cleanup on unmount |
| **Image loading** | Manual `loadImages()` callback | Use Next.js `<Image>` with `onLoad` callback, or keep native `<img>` |
| **Re-renders** | None (vanilla JS) | Must guard against React re-renders destroying Three.js state |
| **GSAP Club plugins** | `ScrollSmoother`, `SplitText`, `Flip` are premium — need GSAP Club license | Same requirement in Next.js |

### 11. Simplified Alternative — No Three.js

If you want the pixelated effect **without** Three.js overhead, you could:
1. Use a **Canvas 2D** approach — draw the image pixelated on a 2D canvas, progressively increase resolution
2. Use **CSS `image-rendering: pixelated`** + scale a tiny version up, then crossfade to full-res
3. Use **WebGL via `@react-three/fiber`** (R3F) for a more React-idiomatic Three.js integration

However, the shader approach gives you the most control over the exact animation (the sweeping reveal band with randomized per-cell timing), which is hard to replicate with pure CSS.

---

### TL;DR

The effect works by overlaying invisible DOM `<img>` elements with Three.js planes using a custom fragment shader that pixelates the image and reveals it progressively via a `uProgress` uniform animated by GSAP ScrollTrigger. To port to Next.js:

1. **Copy shaders as-is** (framework-agnostic GLSL)
2. **Copy `media.ts` and `canvas.ts` as-is** (pure imperative JS)
3. **Wrap in a `'use client'` React component** with `useEffect` for lifecycle
4. **Add `raw-loader`** to `next.config.js` for `.glsl` imports
5. **Replace Barba.js** with Next.js routing + GSAP Flip for transitions
6. **Keep the CSS trick**: `img { opacity: 0 }` with a fixed `<canvas>` behind everything
