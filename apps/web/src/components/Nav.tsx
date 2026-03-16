import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import { isGetTrucknEnabled } from "../../lib/feature-flags";

export default function Nav(): React.ReactElement {
  const getTrucknEnabled = isGetTrucknEnabled();

  return (
    <header className="marketplace-header">
      <div className="container marketplace-nav">
        <Link href="/" className="marketplace-brand">
          Infæmous Freight
        </Link>
        <nav className="marketplace-links" aria-label="Marketplace">
          <Link href="/dashboard" className="nav-link">
            Dashboard
          </Link>
          {getTrucknEnabled ? (
            <Link href="/loads" className="nav-link">
              Loads
            </Link>
          ) : null}
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
