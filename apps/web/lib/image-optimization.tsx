/**
 * Image Optimization Utilities
 *
 * Helper functions and examples for Next.js Image optimization.
 *
 * Benefits:
 * - Automatic WebP/AVIF conversion (40-60% smaller file sizes)
 * - Responsive images (different sizes for mobile/desktop)
 * - Lazy loading (images below fold load on scroll)
 * - Blur placeholder while loading
 * - Optimized caching
 *
 * Usage:
 * import { OptimizedImage } from '@/lib/image-optimization';
 * <OptimizedImage src="/logo.png" alt="Logo" width={200} height={100} />
 */

import Image from "next/image";
import { type ComponentProps } from "react";

interface OptimizedImageProps extends Omit<
  ComponentProps<typeof Image>,
  "placeholder" | "blurDataURL"
> {
  /**
   * Whether this image is above the fold (should load immediately)
   * Use true for hero images, logos in header, etc.
   */
  priority?: boolean;

  /**
   * Enable blur placeholder while loading
   * Requires blurDataURL or importing image as a module
   */
  enableBlur?: boolean;
}

/**
 * Optimized Image Component
 *
 * Wrapper around Next.js Image with best practices applied:
 * - Quality set to 85 (good balance between size and quality)
 * - Blur placeholder for better UX
 * - Automatic format conversion
 *
 * @example
 * <OptimizedImage
 *   src="/hero-bg.jpg"
 *   alt="Hero background"
 *   width={1920}
 *   height={1080}
 *   priority={true}  // Above the fold
 * />
 */
export function OptimizedImage({
  priority = false,
  enableBlur = false,
  quality = 85,
  ...props
}: OptimizedImageProps) {
  return (
    <Image
      {...props}
      quality={quality}
      priority={priority}
      placeholder={enableBlur ? "blur" : "empty"}
      // Next.js automatically:
      // - Converts to WebP/AVIF (configured in next.config.js)
      // - Generates responsive sizes
      // - Lazy loads if priority=false
    />
  );
}

/**
 * Avatar Image Component
 *
 * Optimized for profile pictures, user avatars, etc.
 * Circular images with consistent sizes.
 *
 * @example
 * <AvatarImage src="/users/john.jpg" alt="John Doe" size={48} />
 */
interface AvatarImageProps {
  src: string;
  alt: string;
  size?: 32 | 40 | 48 | 64 | 96 | 128;
  priority?: boolean;
}

export function AvatarImage({ src, alt, size = 48, priority = false }: AvatarImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      quality={90}
      style={{
        borderRadius: "50%",
        objectFit: "cover",
      }}
    />
  );
}

/**
 * Hero Image Component
 *
 * For large hero/banner images with responsive sizes.
 * Automatically loads priority and uses blur placeholder.
 *
 * @example
 * <HeroImage
 *   src="/hero-freight.jpg"
 *   alt="Freight trucks in motion"
 * />
 */
interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function HeroImage({ src, alt, className }: HeroImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1920}
      height={1080}
      priority={true}
      enableBlur={true}
      sizes="100vw"
      style={{
        width: "100%",
        height: "auto",
      }}
      className={className}
    />
  );
}

/**
 * Thumbnail Image Component
 *
 * For small preview images in grids, lists, etc.
 *
 * @example
 * <ThumbnailImage
 *   src="/shipments/123.jpg"
 *   alt="Shipment 123"
 *   width={300}
 *   height={200}
 * />
 */
interface ThumbnailImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export function ThumbnailImage({ src, alt, width = 300, height = 200 }: ThumbnailImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      quality={80}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      style={{
        width: "100%",
        height: "auto",
        objectFit: "cover",
      }}
    />
  );
}

/**
 * Generate blur data URL for placeholder
 *
 * For build-time optimization, import images and use their blurDataURL:
 *
 * @example
 * import logoImg from '@/public/logo.png';
 *
 * <Image
 *   src={logoImg}
 *   alt="Logo"
 *   placeholder="blur"  // Automatically uses logoImg.blurDataURL
 * />
 */
export function generateBlurDataURL(
  width: number,
  height: number,
  color: string = "#cccccc",
): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${color}"/>
    </svg>
  `;
  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Remote image configuration
 *
 * For images from external sources (CDN, user uploads, etc.),
 * ensure domains are configured in next.config.js:
 *
 * @example
 * images: {
 *   remotePatterns: [
 *     {
 *       protocol: 'https',
 *       hostname: 'cdn.example.com',
 *       pathname: '/images/**'
 *     }
 *   ]
 * }
 *
 * Then use:
 * <OptimizedImage
 *   src="https://cdn.example.com/images/photo.jpg"
 *   alt="Photo"
 *   width={800}
 *   height={600}
 * />
 */

/**
 * Image optimization checklist:
 *
 * ✅ Use Next.js Image component (not <img>)
 * ✅ Set priority={true} for above-the-fold images
 * ✅ Use appropriate sizes prop for responsive images
 * ✅ Enable blur placeholder for better UX
 * ✅ Configure remote patterns in next.config.js
 * ✅ Use quality={85} for good balance
 * ✅ Lazy load below-the-fold images (default)
 * ✅ Provide width/height to prevent layout shift
 * ✅ Use WebP/AVIF formats (automatic)
 * ✅ Consider loading="eager" for critical images
 */

/**
 * Performance tips:
 *
 * 1. Hero images: priority={true}, enableBlur={true}
 * 2. Avatars: Fixed sizes (32, 48, 64, 96, 128)
 * 3. Thumbnails: Lower quality (75-80), responsive sizes
 * 4. Background images: Consider CSS background-image for decorative images
 * 5. Icons: Use SVG instead of raster images when possible
 * 6. Logos: SVG preferred, or PNG with transparency
 * 7. Photos: AVIF/WebP (automatic), quality 80-90
 * 8. Large images: Provide multiple sizes via sizes prop
 */
