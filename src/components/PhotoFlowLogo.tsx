import React from 'react';

interface PhotoFlowLogoProps {
  className?: string;
}

/**
 * In-app vector SVG logo for PhotoFlow (6-blade rounded aperture hexagon).
 * Uses currentColor by default or dark #121212 so it adapts crisply at any size.
 */
export const PhotoFlowLogo: React.FC<PhotoFlowLogoProps> = ({ className = 'w-6 h-6' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="156 146 712 732"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M 186.00 389.85 A 44.00 44.00 0 0 1 241.39 347.35 L 429.63 397.79 A 18.00 18.00 0 0 1 437.70 427.91 L 233.80 631.81 A 28.00 28.00 0 0 1 186.00 612.01 Z" />
      <path d="M 454.78 168.60 A 44.00 44.00 0 0 1 519.28 195.32 L 569.73 383.56 A 18.00 18.00 0 0 1 547.68 405.61 L 269.14 330.98 A 28.00 28.00 0 0 1 262.39 279.68 Z" />
      <path d="M 780.78 290.75 A 44.00 44.00 0 0 1 789.90 359.97 L 652.09 497.77 A 18.00 18.00 0 0 1 621.98 489.70 L 547.34 211.17 A 28.00 28.00 0 0 1 588.39 179.67 Z" />
      <path d="M 838.00 634.15 A 44.00 44.00 0 0 1 782.61 676.65 L 594.37 626.21 A 18.00 18.00 0 0 1 586.30 596.09 L 790.20 392.19 A 28.00 28.00 0 0 1 838.00 411.99 Z" />
      <path d="M 569.22 855.40 A 44.00 44.00 0 0 1 504.72 828.68 L 454.27 640.44 A 18.00 18.00 0 0 1 476.32 618.39 L 754.86 693.02 A 28.00 28.00 0 0 1 761.61 744.32 Z" />
      <path d="M 243.22 733.25 A 44.00 44.00 0 0 1 234.10 664.03 L 371.91 526.23 A 18.00 18.00 0 0 1 402.02 534.30 L 476.66 812.83 A 28.00 28.00 0 0 1 435.61 844.33 Z" />
    </svg>
  );
};
