import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { supabaseBrowser } from "../../src/lib/supabase/browser";
import { trackEvent } from "../../src/lib/analytics";

interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  company: string;
}

export default function SignUpPage(): React.ReactElement {
  const router = useRouter();
  const [formData, setFormData] = useState<SignUpFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    company: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const supabase = supabaseBrowser();

  useEffect(() => {
    trackEvent("auth_sign_up_view");
  }, []);

  const validateForm = (): string | null => {
    if (!formData.email) return "Email is required";
    if (!formData.password) return "Password is required";
    if (formData.password.length < 8) return "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword) return "Passwords do not match";
    if (!formData.fullName) return "Full name is required";
    if (!formData.company) return "Company name is required";
    return null;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            company: formData.company,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        trackEvent("auth_sign_up_error", { error: signUpError.message });
        return;
      }

      if (data.user) {
        setMessage("Sign up successful! Check your email to confirm your account.");
        trackEvent("auth_sign_up_success");
        setTimeout(() => {
          router.push("/auth/sign-in");
        }, 3000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      trackEvent("auth_sign_up_error", { error: message });
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignUp = async () => {
    setError(null);
    setLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        trackEvent("auth_github_sign_up_error", { error: signUpError.message });
      } else {
        trackEvent("auth_github_sign_up_started");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      trackEvent("auth_github_sign_up_error", { error: message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        trackEvent("auth_google_sign_up_error", { error: signUpError.message });
      } else {
        trackEvent("auth_google_sign_up_started");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      trackEvent("auth_google_sign_up_error", { error: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up - Infamous Freight</title>
        <meta name="description" content="Create your Infamous Freight account" />
      </Head>

      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <h1>Create Account</h1>
            <p>Start your freight management journey</p>

            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            <form onSubmit={handleSignUp} className="auth-form">
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="company">Company Name</label>
                <input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Your Company"
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary btn-block">
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <div className="divider">Or continue with</div>

            <div className="social-buttons">
              <button onClick={handleGitHubSignUp} disabled={loading} className="btn btn-social">
                GitHub
              </button>
              <button onClick={handleGoogleSignUp} disabled={loading} className="btn btn-social">
                Google
              </button>
            </div>

            <p className="auth-footer">
              Already have an account?{" "}
              <Link href="/auth/sign-in" className="link-primary">
                Sign in
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
