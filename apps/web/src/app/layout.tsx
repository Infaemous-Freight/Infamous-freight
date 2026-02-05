import "./globals.css";

export const metadata = {
  title: "Infæmous Freight",
  description: "AI-Powered Freight Operations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white">{children}</body>
    </html>
  );
}
