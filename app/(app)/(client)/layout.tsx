import "./styles/ai-marketing-home.css";
import { fontVariables } from "./_components/ai-marketing/utils/font";
import { ClientFooter } from "./_components/neural-network/client-footer";
import { ClientHeader } from "./_components/neural-network/client-header";

export default function ClientRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${fontVariables} client-site-root relative min-h-screen overflow-x-hidden bg-background-7 text-background-13`}
    >
      <ClientHeader />
      {children}
      <ClientFooter />
    </div>
  );
}
