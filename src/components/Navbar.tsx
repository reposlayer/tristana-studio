"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Magnetic from "@/components/Magnetic";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { href: "/programi", label: "Programi" },
    { href: "/radionice", label: "Edukacije" },
    { href: "/raspored", label: "Raspored" },
    { href: "/o-nama", label: "O nama" },
    { href: "/kontakt", label: "Kontakt" },
  ];

  return (
    <>
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        className="fixed top-0 w-full z-[100] flex justify-center mt-6 px-4 md:px-0 pointer-events-none"
      >
        <div 
          className={`pointer-events-auto flex justify-between items-center transition-all duration-700 ease-[0.16,1,0.3,1] rounded-full overflow-hidden
            ${isScrolled 
              ? "bg-white/40 backdrop-blur-3xl border border-white/60 shadow-[0_8px_40px_rgba(255,183,197,0.2)] px-6 py-3 w-full max-w-4xl" 
              : "bg-transparent border-transparent px-8 py-5 w-full max-w-7xl"
            }
          `}
        >
          <Magnetic>
            <Link href="/" className="text-xl md:text-2xl font-serif tracking-[0.25em] uppercase text-stone-900 group">
              <span className="group-hover:text-[#D87093] transition-colors duration-500">Apolon</span>
            </Link>
          </Magnetic>
          
          <div className="hidden md:flex gap-8 font-sans text-[10px] tracking-[0.25em] uppercase items-center font-semibold">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Magnetic key={link.href}>
                  <Link 
                    href={link.href}
                    className={`relative px-2 py-2 group transition-all duration-500 flex flex-col items-center
                      ${isActive ? "text-[#D87093]" : "text-stone-600 hover:text-stone-900"}
                    `}
                  >
                    {link.label}
                    <span 
                      className={`absolute -bottom-1 w-1 h-1 rounded-full transition-all duration-500
                        ${isActive 
                          ? "bg-[#D87093] opacity-100 scale-100 shadow-[0_0_8px_rgba(216,112,147,0.8)]" 
                          : "bg-[#FFB7C5] opacity-0 scale-0 group-hover:scale-100 group-hover:opacity-100"
                        }
                      `} 
                    />
                  </Link>
                </Magnetic>
              );
            })}
          </div>

          <button 
            className="md:hidden p-2 text-stone-900 transition-transform active:scale-95 z-50 pointer-events-auto"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} strokeWidth={1.5} />
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, clipPath: "circle(0% at 100% 0)" }}
            animate={{ opacity: 1, clipPath: "circle(150% at 100% 0)" }}
            exit={{ opacity: 0, clipPath: "circle(0% at 100% 0)" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 min-h-screen bg-white/90 backdrop-blur-3xl z-[200] flex flex-col pt-24 px-8 overflow-hidden pointer-events-auto"
          >
            <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-[#FFB7C5]/30 blur-[100px] rounded-full pointer-events-none" />
            
            <button 
              className="absolute top-8 right-8 p-4 text-stone-500 hover:text-stone-900 transition-colors z-[210]"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={32} strokeWidth={1} />
            </button>
            <div className="flex flex-col gap-8 text-4xl font-serif tracking-widest mt-16 relative z-10">
              {links.map((link, idx) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link 
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-block hover:text-[#D87093] transition-colors relative group"
                  >
                    <span className="font-sans text-sm text-[#FFB7C5] absolute -left-8 top-2 opacity-50">0{idx + 1}</span>
                    <span className="">{link.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}