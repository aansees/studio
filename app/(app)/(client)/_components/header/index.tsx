"use client";

import Link from "next/link";
import "./header.css";

const Navbar = () => {
  return (
    <header
      className="lp:max-w-[1290px]! fixed top-5 left-1/2 z-50 mx-auto w-full max-w-[350px] -translate-x-1/2 transition-all duration-400 ease-in-out min-[425px]:max-w-[375px] min-[500px]:max-w-[450px] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1140px]"
    >
      <div className="header-one flex w-full items-center justify-between rounded-lg bg-white pl-2.5 pr-1 py-2.5 backdrop-blur-[25px] xl:py-0 h-12">
        <div>
          <Link href="/" className="font-otis-display text-2xl font-bold">
            <span className="sr-only">Home</span>
            Ancs Studio
          </Link>
        </div>

        <div className="hidden items-center justify-center xl:flex">
          <Link href="/start-project" className="cta">
            <div className="arrow">
              <div></div>
            </div>
            <span className="label">Book a demo</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
