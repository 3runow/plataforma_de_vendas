import Image from "next/image";
import Link from "next/link";
import ContactModal from "./contact-modal";
import { isAuthenticated } from "@/lib/auth";
import UserDropdown from "./user-dropdown";
import LoginButtonWrapper from "./login-button-wrapper";
import MobileMenu from "./mobile-menu";
import CartSidebarWrapper from "./cart-sidebar-wrapper";

export default async function Header() {
  const userIsAuthenticated = await isAuthenticated();
  const navItems = [
    { label: "Início", href: "/" },
    { label: "Sobre", href: "/sobre" },
  ];

  return (
    <header className="flex items-center justify-between flex-col border-b-2 border-zinc-400/10 bg-[#87CEEB]">
      <div className="relative w-full h-24 md:h-32 overflow-hidden flex items-center justify-center bg-[#87CEEB]">
        <div className="relative w-full h-full">
          <Image
            src="/assets/header.jpeg"
            alt="Logo"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
      </div>

      <div className="flex flex-row gap-4 w-full px-4 md:px-32 py-2 bg-[#022044]">
        <MobileMenu navItems={navItems} />

        <nav className="hidden md:flex flex-row gap-4 items-center">
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

        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          <CartSidebarWrapper />
          {userIsAuthenticated ? <UserDropdown /> : <LoginButtonWrapper />}
        </div>
      </div>
    </header>
  );
}
