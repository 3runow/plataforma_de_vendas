import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meus Favoritos - Lista de Desejos",
  description:
    "Veja seus produtos favoritos salvos. Gerencie sua lista de desejos e adicione suas minifiguras preferidas ao carrinho quando quiser.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function FavoritosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
