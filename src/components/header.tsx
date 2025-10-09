import Image from "next/image";
import Link from "next/link";
import ContactModal from "./contact-modal";
import { Button } from "./ui/button";
import { ShoppingCart, User } from "lucide-react";

export default function Header() {
  const navItems = [
    { label: "Início", href: "/" },
    { label: "Sobre", href: "/sobre" },
  ];

  return (
    <header className="flex items-center justify-between flex-col bg-[#022044] border-b-2 border-zinc-400/10">
      <div className="relative w-full h-32">
        <Image
          src="/assets/image/header.png"
          alt="Logo"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="flex flex-row gap-4 justify-between w-full px-32 py-2">
        <nav className="flex flex-row gap-4 items-center">
          {navItems.map((item, index) => (
            <Link
              href={item.href}
              key={index}
              className="hover:underline text-zinc-50 font-medium"
            >
              {item.label}
            </Link>
          ))}
          <ContactModal />
        </nav>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-[#f7f7f7]"
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
          <Button
            variant={"outline"}
            size="icon"
            className="text-[#f7f7f7] hover:text-[#f7f7f7] bg-[#022044] hover:bg-[#01152d]"
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
