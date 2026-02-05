import Link from "next/link";

export function Nav() {
  const navStyle = {
    background: "#ffffff",
    borderBottom: "1px solid #e4e7f0",
  } as const;
  const innerStyle = {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "1rem 1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  } as const;
  const linksStyle = {
    display: "flex",
    gap: "1.5rem",
    fontWeight: 500,
    color: "#5e647a",
  } as const;

  return (
    <nav style={navStyle}>
      <div style={innerStyle}>
        <Link href="/" style={{ fontWeight: 700 }}>
          Infæmous Freight
        </Link>
        <div style={linksStyle}>
          <Link href="/pricing">Pricing</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </div>
    </nav>
  );
}
