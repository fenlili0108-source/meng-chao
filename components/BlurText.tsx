"use client";

import { useEffect, useRef, useState } from "react";

interface BlurTextProps {
  text: string;
  className?: string;
  highlight?: string;
}

export default function BlurText({ text, className = "", highlight }: BlurTextProps) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const [visible, setVisible] = useState(false);
  const words = text.split(" ");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <p
      ref={ref}
      className={`flex flex-wrap justify-center gap-y-[0.1em] ${className}`}
      aria-label={text}
    >
      {words.map((word, index) => {
        const isHighlighted = highlight && word.includes(highlight);
        return (
          <span
            key={`${word}-${index}`}
            className={`${visible ? "blur-word" : "opacity-0"} ${
              isHighlighted ? "display-em" : "display-gradient"
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
            aria-hidden="true"
          >
            {word}
          </span>
        );
      })}
    </p>
  );
}
