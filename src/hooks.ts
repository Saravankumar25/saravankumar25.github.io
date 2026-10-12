import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const SUFFIX = "Saravan Kumar M K";

export function useTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SUFFIX}` : `${SUFFIX} · Software Engineer | Founding Engineer`;
  }, [title]);
}

export function useScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
}

/** Adds `in` once the element scrolls into view; CSS handles reduced motion. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.classList.add("in");
        io.disconnect();
      }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}
