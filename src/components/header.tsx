import Link from "next/link";

export default function Header() {
  const navItems = [
    { label: "Início", href: "/" },
    { label: "Sobre", href: "/sobre" },
  ];

  return (
    <header>
      <img src="./assets/image/header.png" alt="Logo" className="w-auto h-50" />
      <nav className="flex flex-row gap-4">
        {navItems.map((item, index) => (
          <Link href={item.href} key={index} className="hover:underline">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
