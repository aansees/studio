"use client";
import { useEffect, useState } from "react";
import Preloader from "@/components/preloader";
import { AnimatePresence, motion } from "framer-motion";
import Hero from "./_components/hero";
import About from "./_components/about";

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      setIsLoading(false);
      document.body.style.cursor = "default";
      document.body.style.overflow = "";
      window.scrollTo(0, 0);
    }, 2000);
  }, []);
  return (
    <main>
      <AnimatePresence mode="wait">
        {isLoading && <Preloader />}
      </AnimatePresence>
      <div className="fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
        <motion.div
          className="w-full"
          initial={{ y: 100, opacity: 0 }}
          animate={
            !isLoading
              ? {
                  y: 0,
                  opacity: 1,
                  transition: {
                    duration: 0.8,
                    ease: [0.76, 0, 0.24, 1],
                    delay: 0.2,
                  },
                }
              : {}
          }
        >
          <Hero isLoading={isLoading} />
        </motion.div>
      </div>
      <div className="h-screen" />
      <About />
    </main>
  );
}
