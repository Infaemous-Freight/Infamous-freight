import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { supabaseBrowser } from "../../src/lib/supabase/browser";
import { trackEvent } from "../../src/lib/analytics";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const supabase = supabaseBrowser();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current user session
        const {
          data: { user },
          error: sessionError,
        } = await supabase.auth.getUser();

        if (sessionError) {
          throw sessionError;
        }

        if (user) {
          trackEvent("auth_callback_success", { provider: "oauth" });
          // Redirect to dashboard
          router.push("/dashboard");
        } else {
          throw new Error("No user session after OAuth callback");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        trackEvent("auth_callback_error", { error: message });
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [router, supabase]);

  return (
    <>
      <Head>
        <title>Processing Sign In - Infamous Freight</title>
      </Head>

      <div className="callback-page">
        <div className="callback-container">
          {isProcessing ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <p>Processing your sign in...</p>
            </div>
          ) : (
            <div className="error-container">
              <h1>Authentication Error</h1>
              <p>{error}</p>
              <a href="/auth/sign-in" className="btn btn-primary">
                Back to Sign In
              </a>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .callback-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .callback-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .spinner-container {
          text-align: center;
          color: white;
        }

        .spinner {
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .spinner-container p {
          font-size: 18px;
          margin: 0;
        }

        .error-container {
          background: white;
          padding: 40px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .error-container h1 {
          margin: 0 0 16px 0;
          color: #c33;
        }

        .error-container p {
          margin: 0 0 24px 0;
          color: #666;
        }

        .btn {
          display: inline-block;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-primary:hover {
          background: #5568d3;
        }
      `}</style>
    </>
  );
}
