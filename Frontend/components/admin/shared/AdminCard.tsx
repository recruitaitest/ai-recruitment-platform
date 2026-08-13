"use client";

import { ReactNode, useEffect, useRef } from "react";
import { motion, animate, useIsPresent } from "framer-motion";

function CountUp({ value }: { value: string | number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isPresent = useIsPresent();

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !isPresent) return;

    const strVal = value !== undefined && value !== null ? String(value) : "0";
    const numValue = typeof value === "number" ? value : parseFloat(strVal.replace(/[^0-9.-]+/g, ""));
    
    if (isNaN(numValue)) {
      node.textContent = strVal;
      return;
    }

    const isInteger = Number.isInteger(numValue) && !strVal.includes(".");

    const controls = animate(0, numValue, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (latest) => {
        if (nodeRef.current) {
          const formatted = isInteger ? Math.round(latest).toString() : latest.toFixed(1);
          const suffixMatch = strVal.match(/[a-zA-Z%]+$/);
          const prefixMatch = strVal.match(/^[^\d.-]+/);
          const prefix = prefixMatch ? prefixMatch[0] : "";
          const suffix = suffixMatch ? suffixMatch[0] : "";
          nodeRef.current.textContent = `${prefix}${formatted}${suffix}`;
        }
      },
    });

    return () => controls.stop();
  }, [value, isPresent]);

  return <span ref={nodeRef}>{value}</span>;
}

interface AdminCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
}

export default function AdminCard({
  title,
  value,
  icon,
  description,
}: AdminCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="rounded-2xl border border-border bg-surface p-5 shadow-soft hover:shadow-elevated hover:border-primary/40 transition-shadow duration-300"
    >
      <div className="flex items-start justify-between">
        {/* Left Content */}
        <div>
          <p className="text-sm font-medium text-muted">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
            <CountUp value={value} />
          </h3>

          {description && (
            <p className="mt-2 text-sm text-muted">
              {description}
            </p>
          )}
        </div>

        {/* Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}