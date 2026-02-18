/**
 * Breadcrumb Navigation Component - Improves User Orientation
 * Shows users where they are in the site hierarchy
 */

import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./Breadcrumb.module.css";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  autoGenerate?: boolean;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, autoGenerate = true }) => {
  const router = useRouter();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    // If custom items provided, use those
    if (items && items.length > 0) {
      return items;
    }

    // Auto-generate from path if enabled
    if (!autoGenerate) {
      return [];
    }

    const pathSegments = router.pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Don't link the last item (current page)
      const isLast = index === pathSegments.length - 1;

      breadcrumbs.push({
        label: formatLabel(segment),
        href: isLast ? undefined : currentPath,
      });
    });

    return breadcrumbs;
  };

  const formatLabel = (segment: string): string => {
    // Convert URL segments to readable labels
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumb on home page
  }

  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb navigation">
      <ol className={styles.breadcrumbList}>
        {breadcrumbs.map((item, index) => {
          return (
            <li key={index} className={styles.breadcrumbItem}>
              {item.href ? (
                <>
                  <Link href={item.href} className={styles.breadcrumbLink}>
                    {item.label}
                  </Link>
                  <span className={styles.breadcrumbSeparator} aria-hidden="true">
                    /
                  </span>
                </>
              ) : (
                <span className={styles.breadcrumbCurrent} aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
