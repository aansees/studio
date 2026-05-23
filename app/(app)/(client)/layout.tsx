import "./styles/ai-marketing-home.css";
import { fontVariables } from "./_components/ai-marketing/utils/font";

export default function ClientRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${fontVariables} client-site-root relative min-h-screen overflow-x-hidden bg-background-7 text-background-13`}
    >
      {children}
    </div>
  );
}
