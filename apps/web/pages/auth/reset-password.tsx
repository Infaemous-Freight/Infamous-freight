import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { supabaseBrowser } from "../../src/lib/supabase/browser";
import { trackEvent } from "../../src/lib/analytics";

interface ResetPasswordState {
  step: "request" | "reset"; // Step 1: request reset, Step 2: reset password
  email: string;
  newPassword: string;
  confirmPassword: string;
  loading: boolean;
  error: string | null;
  message: string | null;
}

export default function ResetPasswordPage(): React.ReactElement {
  const router = useRouter();
  const [state, setState] = useState<ResetPasswordState>({
    step: "request",
    email: "",
    newPassword: "",
    confirmPassword: "",
    loading: false,
    error: null,
    message: null,
  });
  const supabase = supabaseBrowser();

  useEffect(() => {
    trackEvent("auth_reset_password_view");
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setState((s) => ({ ...s, error: null, message: null, loading: true }));

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(state.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setState((s) => ({ ...s, error: error.message, loading: false }));
        trackEvent("auth_reset_password_request_error", {
          error: error.message,
        });
      } else {
        setState((s) => ({
          ...s,
          message:
            "Check your email for a password reset link. You will be redirected after clicking it.",
          loading: false,
        }));
        trackEvent("auth_reset_password_request_sent");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState((s) => ({ ...s, error: message, loading: false }));
      trackEvent("auth_reset_password_request_error", { error: message });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setState((s) => ({ ...s, error: null, message: null, loading: true }));

    if (state.newPassword !== state.confirmPassword) {
      setState((s) => ({
        ...s,
        error: "Passwords do not match",
        loading: false,
      }));
      return;
    }

    if (state.newPassword.length < 8) {
      setState((s) => ({
        ...s,
        error: "Password must be at least 8 characters",
        loading: false,
      }));
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: state.newPassword,
      });

      if (error) {
        setState((s) => ({ ...s, error: error.message, loading: false }));
        trackEvent("auth_reset_password_error", { error: error.message });
      } else {
        setState((s) => ({
          ...s,
          message: "Password reset successful! Redirecting to sign in...",
          loading: false,
        }));
        trackEvent("auth_reset_password_success");
        setTimeout(() => {
          router.push("/auth/sign-in");
        }, 2000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState((s) => ({ ...s, error: message, loading: false }));
      trackEvent("auth_reset_password_error", { error: message });
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password - Infæmous Freight</title>
        <meta name="description" content="Reset your Infæmous Freight password" />
      </Head>

      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            {state.step === "request" ? (
              <>
                <h1>Reset Password</h1>
                <p>Enter your email to receive a reset link</p>

                {state.error && <div className="alert alert-error">{state.error}</div>}
                {state.message && <div className="alert alert-success">{state.message}</div>}

                <form onSubmit={handleRequestReset} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={state.email}
                      onChange={(e) => setState({ ...state, email: e.target.value })}
                      placeholder="you@example.com"
                      required
                      disabled={state.loading}
                      className="form-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={state.loading}
                    className="btn btn-primary btn-block"
                  >
                    {state.loading ? "Sending..." : "Send Reset Link"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1>Set New Password</h1>
                <p>Enter your new password below</p>

                {state.error && <div className="alert alert-error">{state.error}</div>}
                {state.message && <div className="alert alert-success">{state.message}</div>}

                <form onSubmit={handleResetPassword} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      id="newPassword"
                      type="password"
                      value={state.newPassword}
                      onChange={(e) => setState({ ...state, newPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                      disabled={state.loading}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={state.confirmPassword}
                      onChange={(e) => setState({ ...state, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                      disabled={state.loading}
                      className="form-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={state.loading}
                    className="btn btn-primary btn-block"
                  >
                    {state.loading ? "Resetting..." : "Reset Password"}
                  </button>
                </form>
              </>
            )}

            <p className="auth-footer">
              <Link href="/auth/sign-in" className="link-primary">
                Back to sign in
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
