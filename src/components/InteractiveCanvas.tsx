"use client";

import { useEffect, useRef } from "react";

type DepthLayer = "bg" | "mid" | "fg" | "macro" | "glitter";
type ParticleShape = "petal" | "dust" | "orb";

interface Particle {
  x: number;
  y: number;
  z: number;            
  layer: DepthLayer;    
  shape: ParticleShape;
  size: number;
  length: number;       // For petals only
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  theta: number;        
  spin: number;         
  life: number;
  baseAlpha: number;
  swaySpeed: number;
  swayOffset: number;
  colorStr: string;
}

export default function InteractiveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // alpha: true for blending over Next.js backgrounds, desynchronized for raw latency optimization
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // --- ALICE IN WONDERLAND DREAMY PALETTE ---
    const dreamyColors = [
      "255, 183, 197", // Sakura Pink
      "255, 204, 213", // Pastel Pink
      "248, 224, 255", // Lilac / Soft Dreamy Purple
      "255, 240, 245", // Lavender Blush
      "255, 120, 190"  // Magic Hot Pink
    ];
    const dustColor = "255, 255, 255"; // Pure white glitter

    // --- PARTICLE POOL & LOGIC ---
    // Scaled for performance and visual density: more particles but mostly cheap glitter/bokeh
    const MAX_PARTICLES = window.innerWidth > 768 ? 160 : 80; 
    const particles: Particle[] = [];
    
    const initParticle = (override?: Partial<Particle>): Particle => {
      const roll = Math.random();
      
      let layer: DepthLayer;
      let shape: ParticleShape;
      let z = 0;
      let alphaBase = 0;
      let sizeBase = 0;

      // Distribution logic for Alice in Wonderland magical feel
      if (roll > 0.96) { 
        // MACRO: 4% (Huge out of focus petals passing the eye)
        layer = "macro"; z = 3 + Math.random() * 1.5; shape = "petal"; alphaBase = 0.5; sizeBase = Math.random() * 2 + 2.5; 
      } else if (roll > 0.85) { 
        // GLITTER: 11% (Tiny bright white shimmering stars/dust)
        layer = "glitter"; z = 0.8 + Math.random(); shape = "dust"; alphaBase = Math.random() * 0.8 + 0.2; sizeBase = Math.random() * 1.5 + 0.5;
      } else if (roll > 0.60) {
        // FOREGROUND: 25% (Crisp petals)
        layer = "fg"; z = 1.0 + Math.random() * 0.5; shape = "petal"; alphaBase = 0.85; sizeBase = Math.random() * 0.6 + 0.4;
      } else if (roll > 0.30) {
        // MIDGROUND: 30% (Standard bokeh or soft petals)
        layer = "mid"; z = 0.5 + Math.random() * 0.4; shape = Math.random() > 0.5 ? "petal" : "orb"; alphaBase = 0.6; sizeBase = Math.random() * 0.6 + 0.3;
      } else {
        // BACKGROUND: 30% (Large soft extremely blurred ambient orbs giving atmospheric glow)
        layer = "bg"; z = 0.1 + Math.random() * 0.3; shape = "orb"; alphaBase = 0.15; sizeBase = Math.random() * 2.5 + 1;
      }

      return {
        x: Math.random() * width,
        y: (Math.random() * height - height * 1.2), 
        z,
        layer,
        shape,
        size: sizeBase,
        length: shape === "petal" ? Math.random() * 0.4 + 1.2 : 1, // Elongation only matters for petals
        baseVx: 0,
        baseVy: layer === "glitter" ? (Math.random() * 0.5 + 0.2) * z : (Math.random() * 1.0 + 0.6) * z, // Glitter falls slower like snow
        vx: 0,
        vy: 0,
        theta: Math.random() * Math.PI * 2,
        spin: shape === "petal" ? (Math.random() - 0.5) * 0.05 : 0, // Orbs/dust don't visibly spin
        life: Math.random() * 1000,
        baseAlpha: alphaBase,
        swaySpeed: (Math.random() * 0.015 + 0.005) * z, 
        swayOffset: Math.random() * Math.PI * 2,
        colorStr: shape === "dust" ? dustColor : dreamyColors[Math.floor(Math.random() * dreamyColors.length)],
        ...override
      };
    };

    const populateAndSort = () => {
      for(let i=0; i < MAX_PARTICLES; i++) {
        particles.push(initParticle({ y: Math.random() * height }));
      }
      particles.sort((a, b) => a.z - b.z); // Render background/deep z first
    };
    populateAndSort();

    // --- MOUSE TRACKING ---
    let targetMouseX = -1000;
    let targetMouseY = -1000;
    let currentMouseX = -1000;
    let currentMouseY = -1000;
    
    let globalWindX = 0;
    let globalWindY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    
    // --- RESIZE ---
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    window.addEventListener("resize", handleResize);

    // --- DELTA TIME ANIMATION LOOP ---
    // Pure mathematical rendering without offscreen cached assets. 
    // Arc/bezier mathematically is natively heavily optimized on modern browsers 
    // if we skip dynamic drop-shadows on complex shapes and keep it to globalAlpha.
    let lastTime = 0;
    let animationFrameId: number;

    const render = (time: number) => {
      if (!lastTime) lastTime = time;
      const dt = Math.min((time - lastTime) / 16.666, 3); // 1.0 = ~60fps baseline
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse lerp
      let dx = 0;
      let dy = 0;
      if (targetMouseX !== -1000) {
          if (currentMouseX === -1000) { currentMouseX = targetMouseX; currentMouseY = targetMouseY; }
          const prevX = currentMouseX;
          const prevY = currentMouseY;
          currentMouseX += (targetMouseX - currentMouseX) * 0.15 * dt;
          currentMouseY += (targetMouseY - currentMouseY) * 0.15 * dt;
          dx = currentMouseX - prevX;
          dy = currentMouseY - prevY;
      }
      
      const mouseSpeed = Math.sqrt(dx * dx + dy * dy);

      // Global atmosphere drag
      globalWindX += dx * 0.001;
      globalWindY += dy * 0.001;
      globalWindX *= Math.pow(0.96, dt);
      globalWindY *= Math.pow(0.96, dt);

      let needsSort = false;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life += 1 * dt;

        // Base sinusoidal floatiness (dreamy feel)
        const swayAmplifier = p.shape === "dust" ? 0.8 : 1.8; // Glitter flutters nervously, petals sway wide
        const windX = Math.sin(p.life * p.swaySpeed + p.swayOffset) * p.z * swayAmplifier; 
        
        p.baseVx = windX + (globalWindX * p.z);
        
        // INTERACTION: Scattering from mouse
        if (currentMouseX !== -1000) {
            const pdx = p.x - currentMouseX;
            const pdy = p.y - currentMouseY;
            const distSq = pdx * pdx + pdy * pdy;
            
            const interactionRadiusSq = 45000 * p.z; // Closer objects have a wider reaction radius

            if (distSq < interactionRadiusSq && mouseSpeed > 1) {
                const force = Math.pow((interactionRadiusSq - distSq) / interactionRadiusSq, 1.5);
                const distDist = Math.max(Math.sqrt(distSq), 1);
                
                const ZFactor = p.layer === "macro" ? 1.8 : (1 / p.z);
                
                const pushX = (pdx / distDist) * force * (mouseSpeed * 0.2) * ZFactor;
                const pushY = (pdy / distDist) * force * (mouseSpeed * 0.2) * ZFactor;
                
                p.vx += pushX * dt; 
                p.vy += (pushY - (force * 2.5 * ZFactor)) * dt; // Lifting effect
                p.spin += (Math.random() - 0.5) * force * 0.2 * dt;
            }
        }

        // Apply friction
        p.vx *= Math.pow(0.93, dt); // Air drag
        p.vy += (p.baseVy + (globalWindY * p.z * 0.5) - p.vy) * (1 - Math.pow(0.9, dt)); // Terminal velocity curve
        
        p.x += (p.baseVx + p.vx) * dt;
        p.y += p.vy * dt;
        
        p.theta += p.spin * dt;
        p.spin *= Math.pow(0.98, dt); 

        // Screen Wrapping (continuous flow)
        if (p.y > height + 150) { Object.assign(p, initParticle({ y: -100, x: Math.random() * width })); needsSort = true; }
        if (p.x > width + 150) p.x = -100;
        if (p.x < -150) p.x = width + 100;

        // --- OPTIMIZED DRAWING ---
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.shape === "petal") ctx.rotate(p.theta);
        
        // Glitter logic: Twinkle effect by modulating alpha with sine
        if (p.layer === "glitter") {
            const twinkle = Math.sin(p.life * 0.1) * 0.5 + 0.5; // 0 to 1
            ctx.globalAlpha = p.baseAlpha * twinkle;
        } else {
            ctx.globalAlpha = p.baseAlpha;
        }
        
        const baseRadius = 8 * p.size; // Scalable metric

        if (p.shape === "orb") {
            // Smooth, huge out of focus glowing balls
            ctx.beginPath();
            ctx.arc(0, 0, baseRadius * 1.5, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 1.5);
            gradient.addColorStop(0, `rgba(${p.colorStr}, 1)`);
            gradient.addColorStop(1, `rgba(${p.colorStr}, 0)`);
            ctx.fillStyle = gradient;
            ctx.fill();
        } 
        else if (p.shape === "dust") {
            // Little 4 point star for magical glitter
            ctx.beginPath();
            const spike = baseRadius;
            ctx.moveTo(0, -spike);
            ctx.quadraticCurveTo(spike * 0.2, -spike * 0.2, spike, 0);
            ctx.quadraticCurveTo(spike * 0.2, spike * 0.2, 0, spike);
            ctx.quadraticCurveTo(-spike * 0.2, spike * 0.2, -spike, 0);
            ctx.quadraticCurveTo(-spike * 0.2, -spike * 0.2, 0, -spike);
            ctx.fillStyle = `rgba(${p.colorStr}, 1)`;
            ctx.shadowBlur = spike * 2;
            ctx.shadowColor = `rgba(${p.colorStr}, 0.8)`;
            ctx.fill();
        } 
        else if (p.shape === "petal") {
            // Elegant Sakura Teardrop (Math only, ultra-fast render without CSS blurs on FG)
            ctx.beginPath();
            ctx.moveTo(0, -baseRadius);
            ctx.bezierCurveTo(baseRadius * 0.6, -baseRadius * 0.6, baseRadius * 0.6, baseRadius * p.length, 0, baseRadius * p.length);
            ctx.bezierCurveTo(-baseRadius * 0.6, baseRadius * p.length, -baseRadius * 0.6, -baseRadius * 0.6, 0, -baseRadius);
            ctx.fillStyle = `rgba(${p.colorStr}, ${p.layer === "macro" ? 0.4 : 0.9})`;
            
            // Only add expensive shadowBlur to 'mid' and 'macro' to simulate soft focus
            if (p.layer === "macro") {
                 ctx.shadowBlur = baseRadius;
                 ctx.shadowColor = `rgba(${p.colorStr}, 0.5)`;
            }
            ctx.fill();
        }

        ctx.restore();
      }

      if (needsSort) particles.sort((a, b) => a.z - b.z);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] mix-blend-multiply opacity-90 transition-opacity duration-1000"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
