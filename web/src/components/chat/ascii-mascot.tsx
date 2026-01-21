"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Different mascot characters with their own animation frames
const MASCOT_CHARACTERS = [
  {
    name: "claude",
    block: [
      { face: "(o.o)", body: " |_| " },
      { face: "(-.-)", body: " |_| " },
      { face: "(o.-)", body: " |_| " },
      { face: "(-.o)", body: " |_| " },
    ],
    inline: ["(o.o)", "(-.-)", "(^.^)", "(o.-)"],
  },
  {
    name: "kitty",
    block: [
      { face: "=^.^=", body: " /|\\ " },
      { face: "=-.^=", body: " /|\\ " },
      { face: "=^.-=", body: " /|\\ " },
      { face: "=-.-=", body: " /|\\ " },
    ],
    inline: ["=^.^=", "=-.^=", "=^.-=", "=-.-="],
  },
  {
    name: "bear",
    block: [
      { face: "ʕ·ᴥ·ʔ", body: " /||\\ " },
      { face: "ʕ-ᴥ-ʔ", body: " /||\\ " },
      { face: "ʕ·ᴥ-ʔ", body: " /||\\ " },
      { face: "ʕ-ᴥ·ʔ", body: " /||\\ " },
    ],
    inline: ["ʕ·ᴥ·ʔ", "ʕ-ᴥ-ʔ", "ʕ·ᴥ-ʔ", "ʕ-ᴥ·ʔ"],
  },
  {
    name: "robot",
    block: [
      { face: "[o.o]", body: " |=| " },
      { face: "[-.-]", body: " |=| " },
      { face: "[o.-]", body: " |=| " },
      { face: "[-.o]", body: " |=| " },
    ],
    inline: ["[o.o]", "[-.-]", "[o.-]", "[-.o]"],
  },
  {
    name: "bunny",
    block: [
      { face: "(·.·)", body: " (') " },
      { face: "(-.-)", body: " (') " },
      { face: "(·.-)", body: " (') " },
      { face: "(-.·)", body: " (') " },
    ],
    inline: ["(·.·)", "(-.-)", "(^.^)", "(·.-)"],
  },
  {
    name: "owl",
    block: [
      { face: "{O.O}", body: " /))\\ " },
      { face: "{-.-}", body: " /))\\ " },
      { face: "{O.-}", body: " /))\\ " },
      { face: "{-.O}", body: " /))\\ " },
    ],
    inline: ["{O.O}", "{-.-}", "{O.O}", "{-.O}"],
  },
  {
    name: "ghost",
    block: [
      { face: "༼·_·༽", body: " ~~~ " },
      { face: "༼-_-༽", body: " ~~~ " },
      { face: "༼·_-༽", body: " ~~~ " },
      { face: "༼-_·༽", body: " ~~~ " },
    ],
    inline: ["༼·_·༽", "༼-_-༽", "༼°_°༽", "༼·_-༽"],
  },
  {
    name: "alien",
    block: [
      { face: "👽", body: " \\|/ " },
      { face: "👽", body: " /|\\ " },
      { face: "👽", body: " \\|/ " },
      { face: "👽", body: " /|\\ " },
    ],
    inline: ["◉‿◉", "◉_◉", "◉‿◉", "⊙‿⊙"],
  },
];

export interface AsciiMascotProps {
  variant?: "inline" | "block";
  speed?: number;
  animate?: boolean;
  /** Character index (0-7) or undefined for random selection */
  character?: number;
  className?: string;
}

/**
 * AsciiMascot component that displays an animated ASCII art character.
 * Used as a loading indicator while waiting for Claude's response.
 * Supports multiple character designs that can be randomly selected.
 */
export function AsciiMascot({
  variant = "inline",
  speed = 400,
  animate = true,
  character,
  className,
}: AsciiMascotProps) {
  const [frameIndex, setFrameIndex] = React.useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  // Select character once on mount (stable for the lifetime of this component)
  const [selectedCharacter] = React.useState(() => {
    if (character !== undefined && character >= 0 && character < MASCOT_CHARACTERS.length) {
      return character;
    }
    return Math.floor(Math.random() * MASCOT_CHARACTERS.length);
  });

  const mascot = MASCOT_CHARACTERS[selectedCharacter];

  // Check for reduced motion preference
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Animate through frames
  React.useEffect(() => {
    if (!animate || prefersReducedMotion) return;

    const interval = setInterval(() => {
      const maxFrames =
        variant === "block" ? mascot.block.length : mascot.inline.length;
      setFrameIndex((prev) => (prev + 1) % maxFrames);
    }, speed);

    return () => clearInterval(interval);
  }, [animate, prefersReducedMotion, speed, variant, mascot]);

  const shouldAnimate = animate && !prefersReducedMotion;

  if (variant === "block") {
    const frame = mascot.block[shouldAnimate ? frameIndex : 0];
    return (
      <div
        className={cn("font-mono text-sm text-muted-foreground", className)}
        role="status"
        aria-label="Claude is thinking"
        data-testid="ascii-mascot"
        data-character={mascot.name}
      >
        <div className="flex flex-col items-center">
          <span>{frame.face}</span>
          <span>{frame.body}</span>
        </div>
      </div>
    );
  }

  // Inline variant
  const frame = mascot.inline[shouldAnimate ? frameIndex : 0];
  return (
    <span
      className={cn("font-mono text-sm text-muted-foreground", className)}
      role="status"
      aria-label="Claude is thinking"
      data-testid="ascii-mascot"
      data-character={mascot.name}
    >
      {frame}
    </span>
  );
}

/** Get the number of available mascot characters */
export const MASCOT_COUNT = MASCOT_CHARACTERS.length;

/** Get mascot names for reference */
export const MASCOT_NAMES = MASCOT_CHARACTERS.map((m) => m.name);
