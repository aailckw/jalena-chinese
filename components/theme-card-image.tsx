"use client";

import Image from "next/image";
import { useState } from "react";

interface ThemeCardImageProps {
  themeId: string;
  themeName: string;
}

export function ThemeCardImage({ themeId, themeName }: ThemeCardImageProps) {
  const [showImage, setShowImage] = useState(true);
  if (!showImage) return null;
  return (
    <Image
      src={`/generated/card-images/theme-${themeId}.png`}
      alt={themeName}
      fill
      sizes="(min-width: 640px) 50vw, 100vw"
      className="object-cover transition-transform duration-300 group-hover:scale-105"
      onError={() => setShowImage(false)}
    />
  );
}
