"use client";

import { useState } from "react";
import { Menu, X, LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import ContactModal from "./contact-modal";

interface MobileMenuProps {
  navItems: { label: string; href: string }[];
}

export default function MobileMenu({ navItems }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-[#f7f7f7]"
        onClick={toggleMenu}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleMenu}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[#022044] z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col p-6">
          <div className="flex justify-end mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="text-[#f7f7f7]"
              onClick={toggleMenu}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <nav className="flex flex-col gap-4">
            {navItems.map((item, index) => {
              return (
                <Link
                  href={item.href}
                  key={index}
                  className="text-zinc-50 font-medium text-lg hover:text-zinc-300 transition-colors py-2 flex items-center gap-3"
                  onClick={toggleMenu}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="py-2">
              <ContactModal />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
