import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to actual sign-in page
    router.replace("/auth/sign-in");
  }, [router]);

  return (
    <>
      <Head>
        <title>Sign In - Infamous Freight</title>
      </Head>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <p>Redirecting to sign in...</p>
      </div>
    </>
  );
}
