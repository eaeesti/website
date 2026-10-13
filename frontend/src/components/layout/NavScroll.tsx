"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Keeps the navbar at the top of the window and marks it `data-scrolled` as
 * soon as the page is scrolled, which gives it a background and a smaller
 * logo. It takes no space: the page's dark header shows through it.
 */
export default function NavScroll({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 0);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      data-scrolled={scrolled || undefined}
      className="group/nav sticky top-0 z-30 h-0"
    >
      {children}
    </div>
  );
}
