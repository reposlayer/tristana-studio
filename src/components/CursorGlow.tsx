"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CursorGlow() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  // Raw mouse coordinates
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  // 1. The Core Dot (very fast, sharp tracking)
  const springCore = { damping: 40, stiffness: 400, mass: 0.1 };
  const coreX = useSpring(mouseX, springCore);
  const coreY = useSpring(mouseY, springCore);

  // 2. The Mid Glow (slightly delayed, creating a wake)
  const springMid = { damping: 30, stiffness: 150, mass: 0.5 };
  const midX = useSpring(mouseX, springMid);
  const midY = useSpring(mouseY, springMid);

  // 3. The Grand Ambient Glow (slow, luxurious spread)
  const springAmbient = { damping: 20, stiffness: 60, mass: 1.2 };
  const ambientX = useSpring(mouseX, springAmbient);
  const ambientY = useSpring(mouseY, springAmbient);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    // Hide cursor on touch devices to prevent stuck UI
    if (window.matchMedia("(pointer: coarse)").matches) {
       setIsVisible(false);
       window.removeEventListener("mousemove", handleMouseMove);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isVisible, mouseX, mouseY]);

  if (typeof window !== "undefined" && window.innerWidth < 768) return null;

  return (
    <>
      {/* 
        LAYER 1: The Giant Ambient Bokeh Glow (z-[10]) 
        Gently lights up the background canvas and slides beneath foreground text. 
      */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[10] rounded-full mix-blend-screen"
        style={{
          width: "500px",
          height: "500px",
          x: ambientX,
          y: ambientY,
          translateX: "-50%",
          translateY: "-50%",
          background: "radial-gradient(circle, rgba(215, 185, 140, 0.12) 0%, rgba(141, 126, 107, 0.05) 30%, transparent 60%)",
          filter: "blur(60px)",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
      
      {/* 
        LAYER 2: The Mid Reacting Halo (z-[40] - sits above most elements)
        Provides immediate visual feedback when interacting or hovering.
      */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[40] rounded-full mix-blend-exclusion"
        style={{
          x: midX,
          y: midY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: isClicking ? "40px" : "80px",
          height: isClicking ? "40px" : "80px",
          background: isClicking 
             ? "radial-gradient(circle, rgba(141, 126, 107, 0.3) 0%, transparent 70%)" 
             : "radial-gradient(circle, rgba(215, 185, 140, 0.15) 0%, transparent 70%)",
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />

      {/* 
        LAYER 3: The Sharp Core Dot (z-[50] - strict top layer tracking)
        The physical point of interaction.
      */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[50] rounded-full bg-stone-900 border border-brand-200/50 shadow-[0_0_10px_rgba(215,185,140,0.5)]"
        style={{
          width: "8px",
          height: "8px",
          x: coreX,
          y: coreY,
          translateX: "-50%",
          translateY: "-50%",
          opacity: isVisible ? 1 : 0,
        }}
        animate={{
          scale: isClicking ? 0.5 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      />
    </>
  );
}
