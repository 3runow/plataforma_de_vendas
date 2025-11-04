import Link from "next/link";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Lock,
} from "lucide-react";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#022044] border-t border-zinc-400/10 mt-auto">
      {/* Seção Principal do Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Sobre a Empresa */}
          <div className="space-y-4">
            <Image
              src="/assets/bricks.png"
              alt="BRICKS Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
            <p className="text-sm text-zinc-300 leading-relaxed">
              Sua loja de confiança para os melhores produtos. Qualidade,
              variedade e preços competitivos em um só lugar.
            </p>
            <div className="flex gap-3">
              <Link
                href="#"
                className="p-2 bg-zinc-800/50 rounded-lg text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="p-2 bg-zinc-800/50 rounded-lg text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="p-2 bg-zinc-800/50 rounded-lg text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="p-2 bg-zinc-800/50 rounded-lg text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Institucional */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-50 uppercase tracking-wide">
              Institucional
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/sobre"
                  className="text-sm text-zinc-300 hover:text-zinc-50 transition-colors"
                >
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link
                  href="/politica-de-privacidade"
                  className="text-sm text-zinc-300 hover:text-zinc-50 transition-colors"
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link
                  href="/termos-de-uso"
                  className="text-sm text-zinc-300 hover:text-zinc-50 transition-colors"
                >
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>

          {/* Atendimento */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-50 uppercase tracking-wide">
              Atendimento
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/ajuda#central-ajuda"
                  className="text-sm text-zinc-300 hover:text-zinc-50 transition-colors"
                >
                  Central de Ajuda
                </Link>
              </li>
              <li>
                <Link
                  href="/ajuda#como-comprar"
                  className="text-sm text-zinc-300 hover:text-zinc-50 transition-colors"
                >
                  Como Comprar
                </Link>
              </li>
              <li>
                <Link
                  href="/ajuda#trocas"
                  className="text-sm text-zinc-300 hover:text-zinc-50 transition-colors"
                >
                  Trocas e Devoluções
                </Link>
              </li>
              <li>
                <Link
                  href="/ajuda#rastreamento"
                  className="text-sm text-zinc-300 hover:text-zinc-50 transition-colors"
                >
                  Rastreamento de Pedidos
                </Link>
              </li>
              <li>
                <Link
                  href="/ajuda#pagamento"
                  className="text-sm text-zinc-300 hover:text-zinc-50 transition-colors"
                >
                  Formas de Pagamento
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-50 uppercase tracking-wide">
              Contato
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-zinc-300">
                <Phone className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-zinc-50">SAC</p>
                  <p>(11) 4002-8922</p>
                  <p className="text-xs">Seg-Sex: 9h às 18h</p>
                </div>
              </li>
              <li className="flex items-start gap-2 text-zinc-300">
                <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-zinc-50">E-mail</p>
                  <p>contato@bricks.com.br</p>
                </div>
              </li>
              <li className="flex items-start gap-2 text-zinc-300">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-zinc-50">Endereço</p>
                  <p>São Paulo, SP</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Formas de Pagamento */}
      <div className="border-t border-zinc-400/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-xs font-semibold text-zinc-50 mb-2">
                FORMAS DE PAGAMENTO
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <div className="px-3 py-1.5 bg-white rounded flex items-center justify-center">
                  <Image
                    src="/assets/icons/visa.svg"
                    alt="Visa"
                    width={40}
                    height={32}
                    className="h-8 w-auto"
                  />
                </div>
                <div className="px-3 py-1.5 bg-white rounded flex items-center justify-center">
                  <Image
                    src="/assets/icons/mastercard.svg"
                    alt="Mastercard"
                    width={40}
                    height={24}
                    className="h-6 w-auto"
                  />
                </div>
                <div className="px-3 py-1.5 bg-white rounded flex items-center justify-center">
                  <Image
                    src="/assets/icons/elo.svg"
                    alt="Elo"
                    width={40}
                    height={24}
                    className="h-6 w-auto"
                  />
                </div>
                <div className="px-3 py-1.5 bg-white rounded flex items-center justify-center">
                  <Image
                    src="/assets/icons/pix.svg"
                    alt="PIX"
                    width={40}
                    height={24}
                    className="h-6 w-auto"
                  />
                </div>
                <div className="px-3 py-1.5 bg-white rounded flex items-center justify-center">
                  <Image
                    src="/assets/icons/boleto.svg"
                    alt="Boleto"
                    width={40}
                    height={24}
                    className="h-6 w-auto"
                  />
                </div>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs font-semibold text-zinc-50 mb-2">
                SEGURANÇA
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                <div className="px-3 py-1.5 bg-zinc-800/50 rounded text-xs font-semibold text-zinc-50 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  SSL
                </div>
                <div className="px-3 py-1.5 bg-zinc-800/50 rounded text-xs font-semibold text-zinc-50">
                  SITE SEGURO
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-zinc-400/10 bg-zinc-950/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-zinc-300">
            <p className="text-xs text-center md:text-left">
              © {currentYear} FWR VENDAS LTDA — CNPJ 51.597.963/0001-55
            </p>
            <p className="text-xs text-center md:text-right">
              Site desenvolvido por{" "}
              <span className="font-semibold text-white">Bruno Barros</span> e{" "}
              <span className="font-semibold text-white">Lucas Barros</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
