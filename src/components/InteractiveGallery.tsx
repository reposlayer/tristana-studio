"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";

const images = [
  {
    src: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&w=1200&q=80",
    ratio: "aspect-[3/4]",
    y: "0px",
    title: "SVJESNOST"
  },
  {
    src: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1400&q=80",
    ratio: "aspect-[16/9]",
    y: "80px",
    title: "STRUKTURA"
  },
  {
    src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
    ratio: "aspect-[4/5]",
    y: "-60px",
    title: "SNAGA"
  },
  {
    src: "https://images.unsplash.com/photo-1506126613408-eca07ce68266?auto=format&fit=crop&w=1200&q=80",
    ratio: "aspect-[1/1]",
    y: "40px",
    title: "FOKUS"
  },
  {
    src: "https://images.unsplash.com/photo-1552858725-2758b5fb1286?auto=format&fit=crop&w=1400&q=80",
    ratio: "aspect-[16/10]",
    y: "-40px",
    title: "MIR"
  }
];

export default function InteractiveGallery() {
  const targetRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  
  const [trackScrollWidth, setTrackScrollWidth] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      if (trackRef.current) {
        // Find exactly how far to slide so the last item touches the right edge of screen
        const viewportWidth = window.innerWidth;
        const trackWidth = trackRef.current.scrollWidth;
        setTrackScrollWidth(trackWidth - viewportWidth);
      }
    };
    
    updateDimensions();
    // Use timeout to allow images/fonts to compute before recalculating
    setTimeout(updateDimensions, 500); 
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 25,
    restDelta: 0.001
  });

  // Slide pixel-perfect distance
  const x = useTransform(smoothProgress, [0, 1], [0, -trackScrollWidth]);

  // Subtler parallax for text
  const bgX = useTransform(smoothProgress, [0, 1], ["0%", "-10%"]);

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-transparent">
      
      {/* Sticky Fullscreen Container */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden">
        
        {/* Giant Parallax Typography Layer */}
        <motion.div 
          style={{ x: bgX }}
          className="absolute top-1/2 -translate-y-1/2 left-[5vw] pointer-events-none -z-10 flex gap-48"
        >
           <h2 className="text-[20vw] md:text-[18vw] font-serif text-stone-200/40 whitespace-nowrap select-none tracking-tighter mix-blend-multiply">
              KONTROLA
           </h2>
           <h2 className="text-[20vw] md:text-[18vw] font-serif text-stone-200/40 whitespace-nowrap select-none tracking-tighter mix-blend-multiply">
              POKRETA
           </h2>
           <h2 className="text-[20vw] md:text-[18vw] font-serif text-stone-200/40 whitespace-nowrap select-none tracking-tighter mix-blend-multiply">
              TIJELA
           </h2>
        </motion.div>

        {/* The Track Container */}
        <motion.div 
          ref={trackRef}
          style={{ x }} 
          className="flex items-center gap-12 md:gap-24 px-[5vw] md:px-[15vw] w-max"
        >
          {images.map((item, idx) => (
            <GalleryItem key={idx} item={item} index={idx} progress={smoothProgress} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function GalleryItem({ item, index, progress }: { item: any, index: number, progress: any }) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Parallax mapping *inside* the bounded image
  const imageX = useTransform(progress, [0, 1], ["-10%", "10%"]);
  
  return (
    <div 
      className={`relative shrink-0 w-[85vw] md:w-[45vw] lg:w-[30vw] xl:w-[25vw] ${item.ratio}`}
      style={{ transform: `translateY(${item.y})` }}
    >
      <motion.div 
        className="w-full h-full relative overflow-hidden group shadow-2xl bg-stone-200"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div 
          className="w-[120%] h-full relative -left-[10%]"
          style={{ x: imageX }}
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src={item.src}
            alt={item.title}
            fill
            className="object-cover filter sepia-[0.3] group-hover:sepia-0 group-hover:brightness-110 transition-all duration-1000"
            sizes="(max-width: 768px) 85vw, 30vw"
            quality={90}
          />
        </motion.div>
        
        {/* Soft shadow box, removing hard borders */}
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-1000 pointer-events-none" />
        
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        <div className="absolute bottom-8 left-8 right-8 flex flex-col gap-2 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 ease-[0.16,1,0.3,1] pointer-events-none">
           <span className="text-white/70 font-sans text-xs tracking-[0.4em] uppercase">Pogled 0{index + 1}</span>
           <h3 className="text-white font-serif text-3xl md:text-4xl tracking-wide">{item.title}</h3>
        </div>
      </motion.div>
    </div>
  );
}
