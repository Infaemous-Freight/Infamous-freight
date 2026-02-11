import type { ReactNode } from "react";

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <main className="p-10">
          <h1 className="text-4xl font-bold">Infamous Freight</h1>
          <p>AI-powered freight optimization for owner-operators.</p>
          {children}
        </main>
      </body>
    </html>
  );
}
