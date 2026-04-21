"use client";

import { usePathname } from "next/navigation";
import Footer from "../footer/footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  const showFooter = pathname !== "/blueprints";

  return showFooter ? <Footer /> : null;
}
