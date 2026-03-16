import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function LoginPage(): React.ReactElement {
  const router = useRouter();

  useEffect(() => {
    // Redirect to actual sign-in page
    router.replace("/auth/sign-in");
  }, [router]);

  return (
    <>
      <Head>
        <title>Sign In - Infæmous Freight</title>
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
