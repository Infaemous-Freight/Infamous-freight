import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { ProtectedRoute } from "../src/hooks/ProtectedRoute";
import { useAuthContext } from "../src/context/AuthContext";
import { trackEvent } from "../src/lib/analytics";
import { useEffect } from "react";
import { isGetTrucknEnabled } from "../lib/feature-flags";

function DashboardContent() {
  const { user, signOut } = useAuthContext();
  const router = useRouter();
  const getTrucknEnabled = isGetTrucknEnabled();

  useEffect(() => {
    trackEvent("dashboard_view", user?.id ? { userId: user.id } : {});
  }, [user?.id]);

  const handleSignOut = async () => {
    try {
      await signOut();
      trackEvent("user_signed_out");
      router.push("/");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error signing out:", error);
      trackEvent("sign_out_error", { error: String(error) });
    }
  };

  return (
    <>
      <Head>
        <title>Dashboard - Infamous Freight</title>
      </Head>

      <div className="dashboard-page">
        <aside className="dashboard-sidebar">
          <div className="sidebar-brand">
            <h2>Infamous Freight</h2>
          </div>
          <nav className="sidebar-nav">
            {getTrucknEnabled ? (
              <Link href="/loads" className="nav-link">
                📦 Loads
              </Link>
            ) : null}
            <Link href="/dashboard/usage" className="nav-link">
              📈 AI Usage
            </Link>
            <Link href="/dashboard/billing" className="nav-link">
              💼 Company Billing
            </Link>
            <Link href="/account" className="nav-link">
              👤 Account
            </Link>
            <Link href="/account/billing" className="nav-link">
              💳 Billing
            </Link>
            <Link href="/settings" className="nav-link">
              ⚙️ Settings
            </Link>
          </nav>
          <div className="sidebar-footer">
            <button onClick={handleSignOut} className="btn btn-secondary btn-block">
              Sign Out
            </button>
          </div>
        </aside>

        <main className="dashboard-main">
          <header className="dashboard-header">
            <div></div>
            <div className="user-info">
              <span>{user?.email}</span>
            </div>
          </header>

          <div className="dashboard-content">
            <section className="hero">
              <div className="container hero-inner">
                <div>
                  <p className="section-subtitle">Welcome to Infamous Freight</p>
                  <h1 className="hero-title">Your Dashboard</h1>
                  <p className="hero-copy">
                    Manage your freight operations, view loads, and track billing all in one place.
                  </p>
                  <div className="hero-actions">
                    {getTrucknEnabled ? (
                      <Link href="/loads" className="btn btn-primary">
                        View Available Loads
                      </Link>
                    ) : null}
                    <Link href="/account/billing" className="btn btn-secondary">
                      View Billing
                    </Link>
                  </div>
                </div>
                <div className="hero-card">
                  <h3>Quick Links</h3>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {getTrucknEnabled ? (
                      <li>
                        <Link href="/loads">📦 Available Loads</Link>
                      </li>
                    ) : null}
                    <li>
                      <Link href="/dashboard/usage">📈 AI Usage</Link>
                    </li>
                    <li>
                      <Link href="/dashboard/billing">💼 Company Billing</Link>
                    </li>
                    <li>
                      <Link href="/account">👤 Account Settings</Link>
                    </li>
                    <li>
                      <Link href="/account/billing">💳 Billing & Invoices</Link>
                    </li>
                    <li>
                      <Link href="/settings">⚙️ Preferences</Link>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      <style jsx>{`
        .dashboard-page {
          display: flex;
          min-height: 100vh;
          background: #f5f5f5;
        }

        .dashboard-sidebar {
          width: 280px;
          background: white;
          border-right: 1px solid #e0e0e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          padding: 24px;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }

        .sidebar-brand {
          margin-bottom: 32px;
        }

        .sidebar-brand h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-link {
          padding: 12px 16px;
          border-radius: 6px;
          color: #333;
          text-decoration: none;
          transition: all 0.2s;
          font-size: 14px;
          font-weight: 500;
        }

        .nav-link:hover {
          background: #f0f0f0;
          color: #667eea;
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid #e0e0e0;
        }

        .btn-block {
          width: 100%;
        }

        .dashboard-main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .dashboard-header {
          background: white;
          border-bottom: 1px solid #e0e0e0;
          padding: 16px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 14px;
          color: #666;
        }

        .dashboard-content {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
        }

        @media (max-width: 768px) {
          .dashboard-page {
            flex-direction: column;
          }

          .dashboard-sidebar {
            width: 100%;
            height: auto;
            position: static;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
          }

          .sidebar-nav {
            flex-direction: row;
            gap: 4px;
            flex: 1;
          }

          .sidebar-footer {
            margin-top: 0;
            padding-top: 0;
            border-top: none;
          }

          .btn {
            padding: 8px 12px;
            font-size: 12px;
          }

          .sidebar-brand {
            margin-bottom: 0;
          }

          .dashboard-content {
            padding: 16px;
          }
        }
      `}</style>
    </>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
