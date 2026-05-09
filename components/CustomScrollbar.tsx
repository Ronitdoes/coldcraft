"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { gsap, useGSAP } from "@/lib/gsap";

export default function CustomScrollbar() {
  const pathname = usePathname();
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);
  const progressRef = useRef(0);
  const thumbRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const metricsRef = useRef({
    winHeight: 0,
    docHeight: 0,
    maxScroll: 0,
    thumbHeight: 0,
    canScroll: true
  });

  const [canScroll, setCanScroll] = useState(true);

  const getThumbHeight = useCallback((winH: number, docH: number) => {
    const ratio = winH / docH;
    return Math.max(140, winH * ratio);
  }, []);

  const updateMeasurements = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const winH = window.innerHeight;
    const docH = document.documentElement.scrollHeight;
    const clientH = document.documentElement.clientHeight;
    const maxS = docH - clientH;
    const thumbH = getThumbHeight(winH, docH);
    const scrollable = maxS > 0;

    metricsRef.current = {
      winHeight: winH,
      docHeight: docH,
      maxScroll: maxS,
      thumbHeight: thumbH,
      canScroll: scrollable
    };

    if (scrollable !== canScroll) {
      setCanScroll(scrollable);
    }

    if (thumbRef.current) {
      thumbRef.current.style.setProperty('--thumb-height', `${thumbH}px`);
    }
  }, [canScroll, getThumbHeight]);

  const updateThumbPosition = useCallback((progress: number) => {
    if (!thumbRef.current) return;
    const { winHeight, thumbHeight } = metricsRef.current;
    const offset = progress * (winHeight - thumbHeight);
    thumbRef.current.style.transform = `translate3d(0, ${offset}px, 0)`;
  }, []);

  useGSAP(() => {
    if (isMounted && containerRef.current) {
      gsap.to(containerRef.current, {
        x: 0,
        opacity: 1,
        duration: 1.2,
        delay: 1.5,
        ease: "power4.out",
      });
    }
  }, [isMounted]);

  useEffect(() => {
    const mountFrame = requestAnimationFrame(() => {
      setIsMounted(true);
      updateMeasurements();
    });

    const resizeObserver = new ResizeObserver(() => {
      updateMeasurements();
    });

    if (document.body) {
      resizeObserver.observe(document.body);
    }

    const renderLoop = () => {
      if (!thumbRef.current || !metricsRef.current.canScroll) return;
      
      const lenisInst = Reflect.get(window, "lenis") as { scroll?: number } | undefined;
      const winScroll = lenisInst
        ? lenisInst.scroll ?? 0
        : window.scrollY || document.documentElement.scrollTop;
      
      const { maxScroll } = metricsRef.current;
      if (maxScroll > 0) {
        progressRef.current = winScroll / maxScroll;
        updateThumbPosition(progressRef.current);
      }
    };

    gsap.ticker.add(renderLoop);

    const markScrolling = () => {
      setIsScrolling(true);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => setIsScrolling(false), 700);
    };

    window.addEventListener("scroll", markScrolling, { passive: true });
    window.addEventListener("resize", updateMeasurements, { passive: true });

    return () => {
      cancelAnimationFrame(mountFrame);
      resizeObserver.disconnect();
      gsap.ticker.remove(renderLoop);
      window.removeEventListener("scroll", markScrolling);
      window.removeEventListener("resize", updateMeasurements);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [updateMeasurements, updateThumbPosition]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      isDragging.current = true;
      setIsScrolling(true);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

      const startY = e.clientY;
      const startProgress = progressRef.current;
      const { winHeight, thumbHeight, docHeight } = metricsRef.current;
      const trackRange = winHeight - thumbHeight;

      const onMove = (evt: PointerEvent) => {
        if (!isDragging.current || trackRange <= 0) return;
        const delta = (evt.clientY - startY) / trackRange;
        const clamped = Math.max(0, Math.min(1, startProgress + delta));
        progressRef.current = clamped;

        const maxScroll = docHeight - winHeight;
        window.scrollTo({ top: clamped * maxScroll, behavior: "instant" as ScrollBehavior });
      };

      const onUp = () => {
        isDragging.current = false;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        scrollTimeout.current = setTimeout(() => setIsScrolling(false), 700);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    []
  );

  if (!isMounted || pathname === "/login" || pathname === "/onboarding/resume" || pathname === "/onboarding/profile" || pathname === "/dashboard" || pathname === "/compose" || !canScroll) return null;

  return (
    <div
      ref={containerRef}
      className="fixed top-0 right-0 h-screen w-[40px] pointer-events-none z-[9999] mix-blend-difference hidden md:block opacity-0 translate-x-[50px]"
    >
      <div
        ref={thumbRef}
        className={`absolute top-0 right-0 bg-white pointer-events-auto cursor-grab active:cursor-grabbing flex items-center justify-center overflow-hidden will-change-transform
          ${isScrolling ? "w-[6px] mr-2 opacity-80" : "w-[36px] mr-0 opacity-100"}
        `}
        style={{
          height: 'var(--thumb-height, 140px)',
          transitionProperty: "width, margin, opacity",
          transitionDuration: "500ms",
          transitionTimingFunction: "cubic-bezier(0.76, 0, 0.24, 1)",
        }}
        onPointerDown={handlePointerDown}
      >
        <div
          className={`whitespace-nowrap font-headline font-black text-[14px] kerning-tight uppercase text-black select-none
            ${isScrolling ? "opacity-0" : "opacity-100"}
          `}
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            transitionProperty: "opacity",
            transitionDuration: "300ms",
          }}
        >
          ● C O L D C R A F T
        </div>
      </div>
    </div>
  );
}
