import type { AppProps } from "next/app";
import GlobalLayout from "../components/GlobalLayout";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <GlobalLayout>
      <Component {...pageProps} />
    </GlobalLayout>
  );
}
