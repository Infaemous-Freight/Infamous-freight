import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { supabaseBrowser } from "../../src/lib/supabase/browser";
import { trackEvent } from "../../src/lib/analytics";

export default function SignInPage(): React.ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const supabase = supabaseBrowser();

  useEffect(() => {
    trackEvent("auth_sign_in_view");
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        trackEvent("auth_sign_in_error", { error: signInError.message });
        return;
      }

      if (data.user) {
        trackEvent("auth_sign_in_success");
        const next = router.query.next as string;
        router.push(next || "/dashboard");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      trackEvent("auth_sign_in_error", { error: message });
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signInError) {
        setError(signInError.message);
        trackEvent("auth_github_sign_in_error", { error: signInError.message });
      } else {
        trackEvent("auth_github_sign_in_started");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      trackEvent("auth_github_sign_in_error", { error: message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signInError) {
        setError(signInError.message);
        trackEvent("auth_google_sign_in_error", { error: signInError.message });
      } else {
        trackEvent("auth_google_sign_in_started");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      trackEvent("auth_google_sign_in_error", { error: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In - Infamous Freight</title>
        <meta name="description" content="Sign in to your Infamous Freight account" />
      </Head>

      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <h1>Sign In</h1>
            <p>Welcome back to Infamous Freight</p>

            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            <form onSubmit={handleSignIn} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <Link href="/auth/reset-password" className="link-secondary">
                  Forgot your password?
                </Link>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary btn-block">
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="divider">Or continue with</div>

            <div className="social-buttons">
              <button onClick={handleGitHubSignIn} disabled={loading} className="btn btn-social">
                GitHub
              </button>
              <button onClick={handleGoogleSignIn} disabled={loading} className="btn btn-social">
                Google
              </button>
            </div>

            <p className="auth-footer">
              Don't have an account?{" "}
              <Link href="/auth/sign-up" className="link-primary">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .auth-container {
          width: 100%;
          max-width: 400px;
        }

        .auth-card {
          background: white;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .auth-card h1 {
          margin: 0 0 4px 0;
          font-size: 28px;
          font-weight: 700;
        }

        .auth-card p {
          margin: 0 0 24px 0;
          color: #666;
          font-size: 14px;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .alert-error {
          background: #fee;
          color: #c33;
          border: 1px solid #fcc;
        }

        .alert-success {
          background: #efe;
          color: #3c3;
          border: 1px solid #cfc;
        }

        .auth-form {
          margin-bottom: 24px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          font-size: 14px;
        }

        .form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .form-actions {
          text-align: right;
          margin-bottom: 16px;
        }

        .link-secondary {
          color: #667eea;
          text-decoration: none;
          font-size: 14px;
        }

        .link-secondary:hover {
          text-decoration: underline;
        }

        .btn {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #5568d3;
        }

        .btn-block {
          width: 100%;
        }

        .divider {
          text-align: center;
          margin: 24px 0;
          color: #999;
          font-size: 14px;
          position: relative;
        }

        .divider::before {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          right: 0;
          height: 1px;
          background: #eee;
          z-index: 0;
        }

        .divider {
          position: relative;
          z-index: 1;
        }

        .divider span {
          background: white;
          padding: 0 12px;
        }

        .social-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }

        .btn-social {
          background: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
        }

        .btn-social:hover:not(:disabled) {
          background: #eee;
        }

        .auth-footer {
          text-align: center;
          font-size: 14px;
          color: #666;
          margin: 0;
        }

        .link-primary {
          color: #667eea;
          text-decoration: none;
        }

        .link-primary:hover {
          text-decoration: underline;
        }
      `}</style>
    </>
  );
}
