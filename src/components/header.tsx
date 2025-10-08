import Image from "next/image";
import Link from "next/link";
import ContactDialog from "./contact-dialog";

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
        <nav className="flex flex-row gap-4">
          {navItems.map((item, index) => (
            <Link
              href={item.href}
              key={index}
              className="hover:underline text-zinc-50 font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <ContactDialog />
      </div>
    </header>
  );
}
