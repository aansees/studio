"use client";

import Link from "next/link";

export function NavButton() {
  return (
    <Link href="/start-project" className="client-nav-cta cta shrink-0" aria-label="Start a project">
      <div className="arrow" aria-hidden="true">
        <div />
      </div>
      <span className="label">Start project</span>
    </Link>
  );
}
