"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  angle: number;
  rotSpeed: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  alpha: number;
}

export default function InteractiveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    let particles: Particle[] = [];
    let mouse = { x: -1000, y: -1000 };
    let lastMouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      lastMouse.x = mouse.x;
      lastMouse.y = mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      const dx = mouse.x - lastMouse.x;
      const dy = mouse.y - lastMouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (lastMouse.x === -1000) {
         lastMouse.x = mouse.x;
         lastMouse.y = mouse.y;
         return;
      }

      const spawnCount = Math.min(Math.floor(dist / 5) + 1, 8); // Spawn density
      for (let i = 0; i < spawnCount; i++) {
        const interpX = lastMouse.x + (dx * (i / spawnCount));
        const interpY = lastMouse.y + (dy * (i / spawnCount));
        
        const scatterRange = 25;
        const scatterX = (Math.random() - 0.5) * scatterRange;
        const scatterY = (Math.random() - 0.5) * scatterRange;

        particles.push({
          x: interpX + scatterX,
          y: interpY + scatterY,
          size: Math.random() * 6 + 3, 
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.05,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4 - 0.5, // float up subtly
          life: 0,
          maxLife: Math.random() * 40 + 50, 
          alpha: Math.random() * 0.6 + 0.4 
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
    };
    window.addEventListener("resize", handleResize);

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.rotSpeed;

        const lifePercent = p.life / p.maxLife;
        // Fade in quick, fade out slow
        const currentAlpha = Math.sin(lifePercent * Math.PI) * p.alpha;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        
        // Draw 4-point sparkle
        ctx.beginPath();
        const spike = p.size;
        const inner = p.size * 0.2;
        
        ctx.moveTo(0, -spike);
        ctx.quadraticCurveTo(inner, -inner, spike, 0);
        ctx.quadraticCurveTo(inner, inner, 0, spike);
        ctx.quadraticCurveTo(-inner, inner, -spike, 0);
        ctx.quadraticCurveTo(-inner, -inner, 0, -spike);
        ctx.closePath();
        
        // Luxurious gold/champagne color
        // On white backgrounds it looks like a soft gold star, on dark backgrounds it shines
        ctx.fillStyle = `rgba(189, 169, 137, ${currentAlpha})`;
        ctx.shadowColor = `rgba(189, 169, 137, ${currentAlpha * 0.8})`;
        ctx.shadowBlur = p.size * 1.5;
        ctx.fill();
        
        // Inner hot core
        ctx.beginPath();
        ctx.moveTo(0, -spike * 0.4);
        ctx.quadraticCurveTo(inner * 0.4, -inner * 0.4, spike * 0.4, 0);
        ctx.quadraticCurveTo(inner * 0.4, inner * 0.4, 0, spike * 0.4);
        ctx.quadraticCurveTo(-inner * 0.4, inner * 0.4, -spike * 0.4, 0);
        ctx.quadraticCurveTo(-inner * 0.4, -inner * 0.4, 0, -spike * 0.4);
        ctx.closePath();
        ctx.fillStyle = `rgba(255, 250, 240, ${currentAlpha})`;
        ctx.fill();

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
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ 
        width: "100vw", 
        height: "100vh" 
      }}
    />
  );
}
