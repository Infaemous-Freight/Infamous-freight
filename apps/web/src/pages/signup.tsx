import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to actual sign-up page
    router.replace("/auth/sign-up");
  }, [router]);

  return (
    <>
      <Head>
        <title>Sign Up - Infamous Freight</title>
      </Head>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <p>Redirecting to sign up...</p>
      </div>
    </>
  );
}
