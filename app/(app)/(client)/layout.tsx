import "./styles/variable.css";
import "./styles/typography.css";
import "./styles/common.css";
import Header from "./_components/header";


export default function ClientRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div className="client-site-root relative min-h-screen overflow-x-hidden bg-(--otis-bg) text-(--otis-fg) [--otis-accent1:#ed6a5a] [--otis-accent2:#f4f1bb] [--otis-accent3:#9bc1bc] [--otis-accent4:#5d576b] [--otis-bg:#edf1e8] [--otis-bg2:#d7dbd2] [--otis-fg:#141414]">
        <Header />
        {children}
    </div>
  );
}
