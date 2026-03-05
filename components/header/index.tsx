"use client";

import Link from "next/link";
import FlipText from "@/components/flip-text";

const ease = "[transition-timing-function:cubic-bezier(0.76,0,0.24,1)]";

const navLinks = ["Work", "About", "Contact"];

export default function Header() {
  return (
    <div className="absolute flex z-1 top-0 px-8.75 py-4 justify-between w-full font-light box-border items-center relative">
      <div className="group/logo flex cursor-pointer">
        <p
          className={`m-0 transition-all duration-500 ${ease} group-hover/logo:rotate-360`}
        >
          ©
        </p>
        <div
          className={`flex relative overflow-hidden whitespace-nowrap ml-1.25 transition-all duration-500 ${ease} group-hover/logo:pr-7.5`}
        >
          <p
            className={`relative m-0 transition-transform duration-500 ${ease} group-hover/logo:-translate-x-full`}
          >
            Code by
          </p>
          <p
            className={`relative m-0 pl-[0.3em] transition-transform duration-500 ${ease} group-hover/logo:-translate-x-16.25`}
          >
            Admin12121
          </p>
          <p
            className={`absolute left-30 m-0 pl-[0.3em] transition-transform duration-500 ${ease} group-hover/logo:-translate-x-16.25`}
          ></p>
        </div>
      </div>
      <nav className="flex items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {navLinks.map((link) => (
          <div
            key={link}
            className="group/el flex flex-col relative z-1 p-1 cursor-pointer"
          >
            <FlipText>{link}</FlipText>
          </div>
        ))}
      </nav>
      <Link href="/contact" className="cursor-pointer">
        <FlipText>Let&apos;s Talk</FlipText>
      </Link>
    </div>
  );
}
