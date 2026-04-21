import { SiteShell } from "./_components";
import "./ancs-studio-base.css";
import "./index.css";
import "./preloader.css";
import "./_components/copy/copy.css";
import "./_components/animated-button/animated-button.css";
import "./_components/featured-projects/featured-projects.css";
import "./_components/client-reviews/client-reviews.css";
import "./_components/menu/menu-btn/menu-btn.css";
import "./_components/menu/menu.css";
import "./_components/footer/footer.css";
import Header from "./_components/header";
import Menu from "./_components/menu/menu";
import ConditionalFooter from "./_components/conditional-footer/conditional-footer";

export default function ClientRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-(--otis-bg) text-(--otis-fg) [--otis-accent1:#ed6a5a] [--otis-accent2:#f4f1bb] [--otis-accent3:#9bc1bc] [--otis-accent4:#5d576b] [--otis-bg:#edf1e8] [--otis-bg2:#d7dbd2] [--otis-fg:#141414]">
      <SiteShell>
        <Header />
        <Menu />
        {children}
        <ConditionalFooter />
      </SiteShell>
    </div>
  );
}
