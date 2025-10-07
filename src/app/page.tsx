"use client";

import { Header as Clovis } from "@/components/header";
import { useState } from "react";

export default function Home() {
  function Somar(a: number, b: number): number {
    return a + b;
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-900 text-[#f7f7f7]">
      <Clovis />
    </div>
  );
}
