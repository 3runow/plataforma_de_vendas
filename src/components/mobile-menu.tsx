"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Separator } from "./ui/separator";
import ContactModal from "./contact-modal";

interface MobileMenuProps {
  navItems: { label: string; href: string }[];
}

export default function MobileMenu({ navItems }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-[#f7f7f7] hover:bg-white/10"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="bg-[#022044] border-[#033866] w-72 [&>button]:text-white"
      >
        <SheetHeader>
          <SheetTitle className="text-[#f7f7f7] text-left">Menu</SheetTitle>
        </SheetHeader>

        <Separator className="my-4 bg-white/10" />

        <nav className="flex flex-col gap-2">
          {navItems.map((item, index) => (
            <Link
              href={item.href}
              key={index}
              className="text-zinc-50 font-medium text-base hover:text-zinc-300 hover:bg-white/5 transition-all py-3 px-3 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          <Separator className="my-2 bg-white/10" />

          <div className="px-3 pt-2">
            <ContactModal />
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
