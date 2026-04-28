import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
};

const imageSizes = {
  sm: 32,
  md: 40,
  lg: 64,
};

export default function BrandLogo({ size = "md", className, imageClassName, priority }: BrandLogoProps) {
  const pixels = imageSizes[size];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg ladderstar-gold-gradient shadow-[0_10px_26px_rgba(229,181,54,0.2)]",
        sizeClasses[size],
        className,
      )}
    >
      <Image
        src="/ladderstar-logo.png"
        alt="LadderStar"
        width={pixels}
        height={pixels}
        priority={priority}
        className={cn("h-[82%] w-[82%] object-contain", imageClassName)}
      />
    </span>
  );
}
