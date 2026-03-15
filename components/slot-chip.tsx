"use client";

import { motion } from "framer-motion";
import { User, Package, MapPin, Wrench, Activity, Car } from "lucide-react";
import type { SlotCategory } from "@/lib/lesson-schema";

const CATEGORY_CLASS: Record<SlotCategory, string> = {
  person: "bg-blue-100 border-blue-300 text-blue-800",
  object: "bg-green-100 border-green-300 text-green-800",
  place: "bg-orange-100 border-orange-300 text-orange-800",
  tool: "bg-purple-100 border-purple-300 text-purple-800",
  action: "bg-teal-100 border-teal-300 text-teal-800",
  transport: "bg-amber-100 border-amber-300 text-amber-800",
};

const CATEGORY_ICON: Record<SlotCategory, React.ElementType> = {
  person: User,
  object: Package,
  place: MapPin,
  tool: Wrench,
  action: Activity,
  transport: Car,
};

interface SlotChipProps {
  label: string;
  category: SlotCategory;
  onClick?: () => void;
  selected?: boolean;
  size?: "sm" | "md";
  disabled?: boolean;
}

export function SlotChip({
  label,
  category,
  onClick,
  selected,
  size = "md",
  disabled = false,
}: SlotChipProps) {
  const base = "rounded-xl border-2 font-bold flex items-center justify-center gap-2";
  const sizeClass = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-3 text-lg";
  const selectedClass = selected ? "ring-4 ring-offset-2 ring-[var(--primary)]" : "";
  const interactiveClass = disabled ? "opacity-90 cursor-default" : "cursor-pointer";
  
  const Icon = CATEGORY_ICON[category];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`${base} ${sizeClass} ${CATEGORY_CLASS[category]} ${selectedClass} ${interactiveClass}`}
      aria-pressed={selected}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {Icon && <Icon size={size === "sm" ? 16 : 20} className="opacity-70" />}
      {label}
    </motion.button>
  );
}
