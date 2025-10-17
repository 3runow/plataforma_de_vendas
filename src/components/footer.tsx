export default function Footer() {
  return (
    <footer className="bg-[#022044] border-t border-zinc-400/10 py-2 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-1 text-zinc-50">
          <p className="text-xs font-semibold text-center">
            LOJA OFICIAL BRICKS
          </p>
          <p className="text-[10px] text-center">
            © {new Date().getFullYear()} BRICKS - Todos os direitos reservados
          </p>
          <p className="text-[10px] text-zinc-300 text-center">
            Site desenvolvido por{" "}
            <span className="font-semibold text-white">Bruno Barros</span> e{" "}
            <span className="font-semibold text-white">Lucas Barros</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
