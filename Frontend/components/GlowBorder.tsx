"use client";

import React, { useEffect, useRef, useState } from "react";

export type GlowBorderProps = {
  mode?: "standard" | "multi";
  direction?: "clockwise" | "anti-clockwise";
  speed?: number;
  hoverMultiplier?: number;
  rainbowColors?: string[];
  glowColor?: string;
  tailColor?: string;
  baseColor?: string;
  tailLength?: number;
  dualTails?: boolean;
  borderWidth?: number;
  rounded?: number;
  glowBlur?: number;
  glowOpacity?: number;
  style?: React.CSSProperties;
  className?: string;
  containerClassName?: string;
  children?: React.ReactNode;
};

const DEFAULT_RAINBOW = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#3B82F6",
  "#6366F1",
  "#A855F7",
];

const DEFAULTS = {
  mode: "standard" as const,
  direction: "clockwise" as const,
  speed: 14,
  hoverMultiplier: 3,
  glowColor: "#7086fd", // Aries Electric Blue / Indigo
  tailColor: "rgba(112, 134, 253, 0.4)",
  baseColor: "rgba(112, 134, 253, 0.08)",
  tailLength: 60,
  dualTails: true,
  borderWidth: 2,
  rounded: 32,
  glowBlur: 16,
  glowOpacity: 0.4,
};

export default function GlowBorder({
  mode = DEFAULTS.mode,
  direction = DEFAULTS.direction,
  speed = DEFAULTS.speed,
  hoverMultiplier = DEFAULTS.hoverMultiplier,
  rainbowColors = DEFAULT_RAINBOW,
  glowColor = DEFAULTS.glowColor,
  tailColor = DEFAULTS.tailColor,
  baseColor = DEFAULTS.baseColor,
  tailLength = DEFAULTS.tailLength,
  dualTails = DEFAULTS.dualTails,
  borderWidth = DEFAULTS.borderWidth,
  rounded = DEFAULTS.rounded,
  glowBlur = DEFAULTS.glowBlur,
  glowOpacity = DEFAULTS.glowOpacity,
  style,
  className = "",
  containerClassName = "",
  children,
}: GlowBorderProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const blurLayerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const isRainbow = mode === "multi";
  const live = useRef({ speed, hoverMultiplier, direction });
  live.current = { speed, hoverMultiplier, direction };

  useEffect(() => {
    const host = hostRef.current;
    const layer = layerRef.current;
    const blurLayer = blurLayerRef.current;
    if (!host || !layer) return;

    const sizeLayer = (w: number, h: number) => {
      setBox({ w, h });
      const size = Math.ceil(Math.hypot(w, h)) + 32;
      const sizePx = `${size}px`;
      const offsetPx = `calc(50% - ${size / 2}px)`;

      layer.style.width = sizePx;
      layer.style.height = sizePx;
      layer.style.top = offsetPx;
      layer.style.left = offsetPx;

      if (blurLayer) {
        blurLayer.style.width = sizePx;
        blurLayer.style.height = sizePx;
        blurLayer.style.top = offsetPx;
        blurLayer.style.left = offsetPx;
      }
    };

    sizeLayer(host.clientWidth, host.clientHeight);

    let rect = host.getBoundingClientRect();
    const refreshRect = () => {
      if (host) rect = host.getBoundingClientRect();
    };

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) {
        sizeLayer(cr.width, cr.height);
        refreshRect();
      }
    });

    ro.observe(host);
    window.addEventListener("scroll", refreshRect, { passive: true });
    window.addEventListener("resize", refreshRect);

    let boost = 1;
    let boostTarget = 1;
    let rotation = 0;

    const onMove = (e: PointerEvent) => {
      const p = live.current;
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      boostTarget = inside ? p.hoverMultiplier : 1;
    };

    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const p = live.current;

      boost += (boostTarget - boost) * (1 - Math.exp(-dt / 0.12));
      rotation = (rotation + p.speed * 3.6 * boost * dt) % 360;
      const flip = p.direction === "clockwise" ? 1 : -1;
      const transform = `scaleX(${flip}) rotate(${rotation}deg)`;

      layer.style.transform = transform;
      if (blurLayer) {
        blurLayer.style.transform = transform;
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", refreshRect);
      window.removeEventListener("resize", refreshRect);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  const radiusPx = rounded > 0 ? (rounded > 1 ? rounded : rounded * (Math.min(box.w || 100, box.h || 100) / 2)) : 0;

  const buildGradient = () => {
    if (isRainbow) {
      return `conic-gradient(from 0deg at 50% 50%, ${rainbowColors.join(", ")}, ${rainbowColors[0]})`;
    }

    const span = dualTails ? 180 : 360;
    const l = Math.max(1, (Math.max(0, Math.min(100, tailLength)) / 100) * span * 0.94);
    const tip = Math.max(6, l * 0.35);
    const decay = Math.max(8, l * 0.3);

    const comet = (end: number) =>
      [
        `${glowColor} ${end}deg`,
        `${tailColor} ${end + decay}deg`,
        `${baseColor} ${end + decay * 2}deg`,
        `${baseColor} ${end + span - l}deg`,
        `${tailColor} ${end + span - tip}deg`,
      ].join(", ");

    const stops = dualTails
      ? `${comet(0)}, ${comet(180)}, ${glowColor} 360deg`
      : `${comet(0)}, ${glowColor} 360deg`;

    return `conic-gradient(from 0deg at 50% 50%, ${stops})`;
  };

  const gradientBg = buildGradient();

  return (
    <div
      ref={hostRef}
      className={`relative p-[2px] max-w-full overflow-visible ${containerClassName}`}
      style={{
        borderRadius: `${radiusPx}px`,
        ...style,
      }}
    >
      {/* Soft Diffused Outer Glow Layer */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          borderRadius: `${radiusPx}px`,
          padding: `${borderWidth + 4}px`,
          opacity: glowOpacity,
          filter: `blur(${glowBlur}px)`,
          WebkitFilter: `blur(${glowBlur}px)`,
          overflow: "hidden",
          WebkitMaskImage: "linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)",
          WebkitMaskClip: "content-box, border-box",
          WebkitMaskComposite: "xor",
          maskImage: "linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)",
          maskClip: "content-box, border-box",
          maskComposite: "exclude",
        }}
      >
        <div
          ref={blurLayerRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "200%",
            height: "200%",
            background: gradientBg,
            transformOrigin: "center center",
            willChange: "transform",
          }}
        />
      </div>

      {/* Crisp Core Border Ring Layer */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          borderRadius: `${radiusPx}px`,
          padding: `${borderWidth}px`,
          overflow: "hidden",
          WebkitMaskImage: "linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)",
          WebkitMaskClip: "content-box, border-box",
          WebkitMaskComposite: "xor",
          maskImage: "linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)",
          maskClip: "content-box, border-box",
          maskComposite: "exclude",
        }}
      >
        <div
          ref={layerRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "200%",
            height: "200%",
            background: gradientBg,
            transformOrigin: "center center",
            willChange: "transform",
          }}
        />
      </div>

      {/* Inner Form Content */}
      {children && (
        <div
          className={`relative z-20 w-full h-full ${className}`}
          style={{
            borderRadius: `${Math.max(0, radiusPx - borderWidth)}px`,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
