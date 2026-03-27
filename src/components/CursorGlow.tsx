"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CursorGlow() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  const springCore = { damping: 40, stiffness: 400, mass: 0.1 };
  const coreX = useSpring(mouseX, springCore);
  const coreY = useSpring(mouseY, springCore);

  const springMid = { damping: 30, stiffness: 150, mass: 0.4 };
  const midX = useSpring(mouseX, springMid);
  const midY = useSpring(mouseY, springMid);

  const springAmbient = { damping: 20, stiffness: 60, mass: 1.2 };
  const ambientX = useSpring(mouseX, springAmbient);
  const ambientY = useSpring(mouseY, springAmbient);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="button"], .group, input, textarea')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    if (window.matchMedia("(pointer: coarse)").matches) {
       setIsVisible(false);
       window.removeEventListener("mousemove", handleMouseMove);
       window.removeEventListener("mouseover", handleMouseOver);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isVisible, mouseX, mouseY]);

  // Opt-out easily on SSR
  if (typeof window !== "undefined" && window.innerWidth < 768) return null;

  return (
    <>
      {/* 
        OPTIMIZATION: Removed heavy CSS 'filter: blur()' that recalculates every frame on movement.
        Using purely a smooth radial gradient to achieve the exact same soft ambient glow with minimal GPU cost 
      */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[10] rounded-full mix-blend-multiply will-change-transform"
        style={{
          width: "800px",
          height: "800px",
          x: ambientX,
          y: ambientY,
          translateX: "-50%",
          translateY: "-50%",
          background: "radial-gradient(circle, rgba(230, 200, 205, 0.18) 0%, rgba(245, 220, 225, 0.08) 25%, transparent 60%)",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
      
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998] rounded-full mix-blend-difference bg-white will-change-transform"
        style={{
          x: midX,
          y: midY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: isHovering ? "90px" : (isClicking ? "36px" : "14px"),
          height: isHovering ? "90px" : (isClicking ? "36px" : "14px"),
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: isHovering ? 25 : 20 }}
      />

      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full bg-[#FFB7C5] shadow-[0_0_15px_rgba(255,183,197,1)] will-change-transform"
        style={{
          width: "6px",
          height: "6px",
          x: coreX,
          y: coreY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isHovering ? 0 : (isClicking ? 0.5 : 1),
          opacity: isVisible ? (isHovering ? 0 : 1) : 0,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
      />
    </>
  );
}
