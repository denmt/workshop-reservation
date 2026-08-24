"use client";
import React from "react";

export default function Hero() {
  return (
    <section className="relative h-screen overflow-hidden bg-white">
      <img
        src="/hero-left.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-[109vh] w-auto -translate-y-[8%] object-contain object-left object-top"
      />
      <img
        src="/hero-right.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-[109vh] w-auto -translate-y-[8%] object-contain object-right object-top"
      />

      <div className="relative z-10 mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-6 text-center">
        <h1 className="leading-tight">
          <span className="hero-headline block text-4xl tracking-tight text-black md:text-5xl lg:text-6xl">
            Make something
          </span>
          <span className="relative mt-2 inline-block">
            <span
              aria-hidden
              className="absolute -inset-x-3 -inset-y-1 bg-[#f5e642] md:-inset-x-4"
            />
            <span className="hero-emphasis relative text-4xl text-black md:text-5xl lg:text-6xl">
              amazing!
            </span>
          </span>
        </h1>

        <p className="hero-subheading mt-8 max-w-xl text-base leading-relaxed text-black md:text-lg">
          Join hands-on workshops in different crafts. <br></br> Reserve your
          workbench and bring your ideas to life.
        </p>
      </div>

      <div
        className="absolute bottom-0 left-0 z-20 h-2 w-full bg-[#f5e642]"
        aria-hidden
      />
    </section>
  );
}
