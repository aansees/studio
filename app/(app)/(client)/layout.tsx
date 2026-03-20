import { HomeFooter, TransitionRouterShell } from "./_components";

export default function ClientRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="overflow-x-hidden bg-[var(--otis-bg)] text-[var(--otis-fg)] [--otis-accent1:#ed6a5a] [--otis-accent2:#f4f1bb] [--otis-accent3:#9bc1bc] [--otis-accent4:#5d576b] [--otis-bg:#edf1e8] [--otis-bg2:#d7dbd2] [--otis-fg:#141414]">
      <TransitionRouterShell>
        {children}
        <HomeFooter />
      </TransitionRouterShell>
    </div>
  );
}
