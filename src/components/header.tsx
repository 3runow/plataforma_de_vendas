import Image from "next/image";
import Link from "next/link";
import ContactModal from "./contact-modal";
import { isAuthenticated } from "@/lib/auth";
import UserDropdown from "./user-dropdown";
import LoginButton from "./login-button";
import MobileMenu from "./mobile-menu";
import CartSidebar from "./cart-sidebar";

export default async function Header() {
  const userIsAuthenticated = await isAuthenticated();
  const navItems = [
    { label: "Início", href: "/" },
    { label: "Sobre", href: "/sobre" },
  ];

  return (
    <header className="flex items-center justify-between flex-col bg-[#022044] border-b-2 border-zinc-400/10">
      <div className="relative w-full h-24 md:h-32">
        <Image
          src="/assets/image/header.png"
          alt="Logo"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="flex flex-row gap-4 w-full px-4 md:px-32 py-2">
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
          <CartSidebar />
          {userIsAuthenticated ? <UserDropdown /> : <LoginButton />}
        </div>
      </div>
    </header>
  );
}
