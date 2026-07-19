"use client";

import Image from "next/image";

interface Props {
  src: string;
  alt: string;
  /** sm / md / lg = section bands; hero = single full-width home image */
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  priority?: boolean;
}

/** Full-width section image — serves high-res sources sharply. */
export default function SectionImage({
  src,
  alt,
  size = "md",
  className = "",
  priority = false,
}: Props) {
  return (
    <figure className={`fof-section-media fof-section-media-${size} ${className}`.trim()}>
      <Image
        src={src}
        alt={alt}
        width={3840}
        height={2560}
        quality={92}
        className="fof-section-media-img"
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1400px) 92vw, 1280px"
      />
    </figure>
  );
}
