/**
 * Enhanced Navigation Bar - 100% User-Friendly
 * Features:
 * - Clear visual hierarchy
 * - Responsive design with mobile hamburger menu
 * - Accessibility compliant (ARIA labels, keyboard navigation)
 * - Active page highlighting
 * - Search functionality
 * - User profile dropdown
 * - Notification badges
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuthContext } from "../src/context/AuthContext";
import styles from "./NavigationBar.module.css";

interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: number;
  requiresAuth?: boolean;
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "📊", requiresAuth: true },
  { label: "Shipments", href: "/shipments", icon: "📦", badge: 3, requiresAuth: true },
  { label: "Analytics", href: "/analytics", icon: "📈", requiresAuth: true },
  { label: "Fleet", href: "/fleet", icon: "🚛", requiresAuth: true },
  { label: "Marketplace", href: "/marketplace", icon: "🏪" },
];

const publicNavItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/product" },
  { label: "Solutions", href: "/solutions" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
];

export const NavigationBar: React.FC = () => {
  const router = useRouter();
  const { user, signOut } = useAuthContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isActivePath = (href: string) => {
    if (href === "/") return router.pathname === "/";
    return router.pathname.startsWith(href);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  // Close menus when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setUserMenuOpen(false);
  }, [router.pathname]);

  // Close menus on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setSearchOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const navItems = user ? mainNavItems : publicNavItems;

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Main navigation">
      <div className={styles.navbarContainer}>
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="Infamous Freight Home">
          <span className={styles.logoIcon}>⚡</span>
          <span className={styles.logoText}>Infamous Freight</span>
        </Link>

        {/* Desktop Navigation */}
        <ul className={styles.navMenu} role="menubar">
          {navItems.map((item) => (
            <li key={item.href} role="none">
              <Link
                href={item.href}
                className={`${styles.navLink} ${isActivePath(item.href) ? styles.active : ""}`}
                role="menuitem"
                aria-current={isActivePath(item.href) ? "page" : undefined}
              >
                {item.icon && <span className={styles.navIcon}>{item.icon}</span>}
                <span>{item.label}</span>
                {item.badge && (
                  <span className={styles.badge} aria-label={`${item.badge} notifications`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right Actions */}
        <div className={styles.navActions}>
          {/* Search */}
          <button
            className={styles.iconButton}
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
            aria-expanded={searchOpen}
          >
            🔍
          </button>

          {user ? (
            <>
              {/* Notifications */}
              <button
                className={styles.iconButton}
                aria-label="Notifications"
                onClick={() => router.push("/notifications")}
              >
                🔔
                <span className={styles.notificationDot} aria-label="New notifications"></span>
              </button>

              {/* User Menu */}
              <div className={styles.userMenu}>
                <button
                  className={styles.userButton}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <span className={styles.userAvatar}>
                    {user?.email?.[0]?.toUpperCase() || "U"}
                  </span>
                  <span className={styles.userName}>{user?.email?.split("@")[0] || "User"}</span>
                  <span className={styles.chevron}>▼</span>
                </button>

                {userMenuOpen && (
                  <div className={styles.userDropdown} role="menu">
                    <Link href="/profile" className={styles.dropdownItem} role="menuitem">
                      👤 Profile
                    </Link>
                    <Link href="/settings" className={styles.dropdownItem} role="menuitem">
                      ⚙️ Settings
                    </Link>
                    <Link href="/billing" className={styles.dropdownItem} role="menuitem">
                      💳 Billing
                    </Link>
                    <hr className={styles.dropdownDivider} />
                    <button
                      onClick={handleLogout}
                      className={styles.dropdownItem}
                      role="menuitem"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.loginButton}>
                Login
              </Link>
              <Link href="/signup" className={styles.signupButton}>
                Get Started
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className={styles.mobileMenuButton}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {searchOpen && (
        <div className={styles.searchBar}>
          <form onSubmit={handleSearch} role="search">
            <input
              type="search"
              placeholder="Search shipments, loads, drivers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              autoFocus
              aria-label="Search"
            />
            <button type="submit" className={styles.searchButton} aria-label="Submit search">
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu} role="dialog" aria-label="Mobile navigation">
          <ul className={styles.mobileMenuList}>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${styles.mobileMenuItem} ${
                    isActivePath(item.href) ? styles.active : ""
                  }`}
                >
                  {item.icon && <span className={styles.navIcon}>{item.icon}</span>}
                  <span>{item.label}</span>
                  {item.badge && <span className={styles.badge}>{item.badge}</span>}
                </Link>
              </li>
            ))}
          </ul>

          {!user && (
            <div className={styles.mobileMenuActions}>
              <Link href="/login" className={styles.mobileLoginButton}>
                Login
              </Link>
              <Link href="/signup" className={styles.mobileSignupButton}>
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default NavigationBar;
