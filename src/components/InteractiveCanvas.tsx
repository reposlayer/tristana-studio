"use client";

import { useEffect, useRef } from "react";

// Particle Types
interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  length: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  theta: number; // Rotation
  spin: number;  // Rotation speed
  life: number;
  baseAlpha: number;
  isBokeh: boolean;
  swaySpeed: number;
  swayOffset: number;
  imgIndex: number;
  type: "petal" | "leaf";
}

export default function InteractiveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use alpha: true for transparency, desynchronized for less latency
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Precise, luxurious Sakura palette & light green leaves
    const sakuraColors = [
      "255, 183, 197", // Soft pink
      "255, 204, 213", // Pastel pink
      "255, 228, 225", // Misty rose
      "255, 240, 245", // Lavender blush
      "255, 105, 180"  // Hot pink
    ];

    const leafColors = [
      "180, 220, 160", // Light moss green
      "160, 210, 140", // Fresh pale green
      "200, 230, 180"  // Faded matcha
    ];

    // --- OPTIMIZATION 1: PRE-RENDER ASSETS ---
    const preRenderedPetals: HTMLCanvasElement[] = [];
    const preRenderedBokeh: HTMLCanvasElement[] = [];
    const preRenderedLeaves: HTMLCanvasElement[] = [];
    const preRenderedLeafBokeh: HTMLCanvasElement[] = [];

    const renderAsset = (color: string, isBokeh: boolean, isLeaf: boolean = false) => {
      const offscreen = document.createElement("canvas");
      const s = 20; 
      offscreen.width = s * 2;
      offscreen.height = s * 4;
      const octx = offscreen.getContext("2d");
      
      if (octx) {
        octx.translate(s, s * 2);
        
        if (isBokeh) {
          octx.beginPath();
          octx.ellipse(0, 0, s * 0.8, s * 1.5, 0, 0, Math.PI * 2);
          octx.fillStyle = `rgba(${color}, 0.2)`;
          octx.shadowBlur = s * 0.8;
          octx.shadowColor = `rgba(${color}, 0.6)`;
          octx.fill();
        } else {
          octx.beginPath();
          if (isLeaf) {
            // Sharper leaf shape
            octx.moveTo(0, -s * 1.2);
            octx.bezierCurveTo(s * 0.8, -s * 0.4, s * 0.6, s * 0.8, 0, s * 1.2);
            octx.bezierCurveTo(-s * 0.6, s * 0.8, -s * 0.8, -s * 0.4, 0, -s * 1.2);
          } else {
            // Petal teardrop
            octx.moveTo(0, -s);
            octx.bezierCurveTo(s * 0.6, -s * 0.6, s * 0.6, s, 0, s);
            octx.bezierCurveTo(-s * 0.6, s, -s * 0.6, -s * 0.6, 0, -s);
          }
          octx.fillStyle = `rgba(${color}, 0.85)`;
          octx.shadowBlur = s * 0.3;
          octx.shadowColor = `rgba(${color}, 0.8)`;
          octx.fill();

          // Leaf vein
          if (isLeaf) {
            octx.beginPath();
            octx.moveTo(0, -s * 1.1);
            octx.lineTo(0, s * 1.1);
            octx.strokeStyle = `rgba(255,255,255,0.3)`;
            octx.lineWidth = 1;
            octx.stroke();
          }
        }
      }
      return offscreen;
    };

    sakuraColors.forEach(color => {
      preRenderedPetals.push(renderAsset(color, false, false));
      preRenderedBokeh.push(renderAsset(color, true, false));
    });

    leafColors.forEach(color => {
      preRenderedLeaves.push(renderAsset(color, false, true));
      preRenderedLeafBokeh.push(renderAsset(color, true, true));
    });

    // --- OPTIMIZATION 2: FIXED PARTICLE POOL ---
    const MAX_PARTICLES = window.innerWidth > 768 ? 80 : 40; 
    const particles: Particle[] = [];
    
    const initParticle = (override?: Partial<Particle>): Particle => {
      const isBokeh = Math.random() > 0.6; // 40% background blur
      const z = isBokeh ? (Math.random() * 0.3 + 0.1) : (Math.random() * 1 + 0.5); 
      const isLeaf = Math.random() > 0.85; // 15% are leaves

      return {
        x: Math.random() * width,
        y: (Math.random() * height - height * 1.5), 
        z,
        size: isBokeh ? (Math.random() * 1 + 0.5) : (Math.random() * 0.4 + 0.2),
        length: Math.random() * 0.3 + 0.85, 
        baseVx: 0,
        baseVy: (Math.random() * 1.5 + 0.8) * z, 
        vx: 0,
        vy: 0,
        theta: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.04,
        life: Math.random() * 1000,
        baseAlpha: isBokeh ? (Math.random() * 0.12 + 0.05) : (Math.random() * 0.6 + 0.2),
        type: isLeaf ? "leaf" : "petal",
        isBokeh,
        swaySpeed: Math.random() * 0.015 + 0.01,
        swayOffset: Math.random() * Math.PI * 2,
        imgIndex: isLeaf 
            ? Math.floor(Math.random() * leafColors.length) 
            : Math.floor(Math.random() * sakuraColors.length),
        ...override
      };
    };

    for(let i=0; i < MAX_PARTICLES; i++) {
       particles.push(initParticle({ y: Math.random() * height }));
    }

    // --- MOUSE TRACKING & PHYSICS ---
    let mouseX = -1000;
    let mouseY = -1000;
    let oldMouseX = -1000;
    let oldMouseY = -1000;
    
    const handleMouseMove = (e: MouseEvent) => {
      oldMouseX = mouseX;
      oldMouseY = mouseY;
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    window.addEventListener("resize", handleResize);

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const dx = mouseX - oldMouseX;
      const dy = mouseY - oldMouseY;
      const mouseSpeed = Math.sqrt(dx * dx + dy * dy);

      if (mouseX !== -1000) {
          oldMouseX += (mouseX - oldMouseX) * 0.1;
          oldMouseY += (mouseY - oldMouseY) * 0.1;
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life += 1;

        // Base physics
        const windX = Math.sin(p.life * p.swaySpeed + p.swayOffset) * p.z * 1.5; 
        p.baseVx = windX;

        // Interaction physics: "Razbucivanje" (Scattering)
        if (mouseX !== -1000) {
            const pdx = p.x - mouseX;
            const pdy = p.y - mouseY;
            const distSq = pdx * pdx + pdy * pdy;
            const interactionRadiusSq = 50000; // ~220px radius

            if (distSq < interactionRadiusSq && mouseSpeed > 1) {
                const force = (interactionRadiusSq - distSq) / interactionRadiusSq;
                const distDist = Math.max(Math.sqrt(distSq), 1);
                
                const pushX = (pdx / distDist) * force * (mouseSpeed * 0.12);
                const pushY = (pdy / distDist) * force * (mouseSpeed * 0.12);
                
                p.vx += pushX * (1.2 / p.z); 
                p.vy += pushY * (1.2 / p.z) - (force * 2.5);
                p.spin += (Math.random() - 0.5) * force * 0.15;
            }
        }

        p.vx *= 0.95; 
        p.vy += (p.baseVy - p.vy) * 0.06;
        
        p.x += p.baseVx + p.vx;
        p.y += p.vy;
        
        p.theta += p.spin;
        p.spin *= 0.98; 

        // Bounds wrap
        if (p.y > height + 80) {
           Object.assign(p, initParticle({ y: -80, x: Math.random() * width }));
        }
        if (p.x > width + 80) p.x = -80;
        if (p.x < -80) p.x = width + 80;

        // --- DRAWING ---
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.theta);
        
        ctx.globalAlpha = p.baseAlpha;
        
        let asset;
        if (p.type === "leaf") {
            asset = p.isBokeh ? preRenderedLeafBokeh[p.imgIndex] : preRenderedLeaves[p.imgIndex];
        } else {
            asset = p.isBokeh ? preRenderedBokeh[p.imgIndex] : preRenderedPetals[p.imgIndex];
        }
        
        const drawW = 40 * p.size;
        const drawH = 80 * p.size * p.length;
        
        ctx.drawImage(asset, -drawW / 2, -drawH / 2, drawW, drawH);
        
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] opacity-90 transition-opacity duration-1000 mix-blend-multiply"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
