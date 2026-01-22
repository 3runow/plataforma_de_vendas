"use client";

import {
  HelpCircle,
  ShoppingCart,
  RefreshCw,
  Package,
  CreditCard,
  Truck,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { scrollToElement } from "@/lib/utils/scrollToElement";

export default function AjudaPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-[#022044] text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            Central de Ajuda
          </h1>
          <p className="text-zinc-300 text-center max-w-2xl mx-auto">
            Encontre respostas para suas dúvidas sobre compras, entregas, trocas
            e muito mais.
          </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4">
          <nav className="flex gap-4 overflow-x-auto py-4 scrollbar-hide">
            <a
              href="#central-ajuda"
              onClick={scrollToElement}
              className="text-sm font-medium text-zinc-600 hover:text-[#022044] whitespace-nowrap px-3 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              Central de Ajuda
            </a>
            <a
              href="#como-comprar"
              onClick={scrollToElement}
              className="text-sm font-medium text-zinc-600 hover:text-[#022044] whitespace-nowrap px-3 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              Como Comprar
            </a>
            <a
              href="#trocas"
              onClick={scrollToElement}
              className="text-sm font-medium text-zinc-600 hover:text-[#022044] whitespace-nowrap px-3 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              Trocas e Devoluções
            </a>
            <a
              href="#rastreamento"
              onClick={scrollToElement}
              className="text-sm font-medium text-zinc-600 hover:text-[#022044] whitespace-nowrap px-3 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              Rastreamento
            </a>
            <a
              href="#pagamento"
              onClick={scrollToElement}
              className="text-sm font-medium text-zinc-600 hover:text-[#022044] whitespace-nowrap px-3 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              Formas de Pagamento
            </a>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Central de Ajuda */}
          <section id="central-ajuda" className="scroll-mt-24">
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <HelpCircle className="h-6 w-6 text-[#022044]" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900">
                  Central de Ajuda
                </h2>
              </div>
              <div className="space-y-4 text-zinc-600">
                <p>
                  Bem-vindo à Central de Ajuda da BRICKS! Estamos aqui para
                  ajudá-lo em todas as etapas da sua compra.
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="border border-zinc-200 rounded-lg p-4">
                    <Phone className="h-5 w-5 text-[#022044] mb-2" />
                    <h3 className="font-semibold text-zinc-900 mb-1">
                      Telefone
                    </h3>
                    <p className="text-sm">(11) 4002-8922</p>
                    <p className="text-xs text-zinc-500">Seg-Sex: 9h às 18h</p>
                  </div>
                  <div className="border border-zinc-200 rounded-lg p-4">
                    <Mail className="h-5 w-5 text-[#022044] mb-2" />
                    <h3 className="font-semibold text-zinc-900 mb-1">E-mail</h3>
                    <p className="text-sm">contato@oficialbricks.com.br</p>
                    <p className="text-xs text-zinc-500">Resposta em até 24h</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Como Comprar */}
          <section id="como-comprar" className="scroll-mt-24">
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900">
                  Como Comprar
                </h2>
              </div>
              <div className="space-y-6 text-zinc-600">
                <div>
                  <h3 className="font-semibold text-zinc-900 mb-3">
                    Passo a passo para realizar sua compra:
                  </h3>
                  <ol className="space-y-3 list-decimal list-inside">
                    <li>
                      <strong>Escolha seus produtos:</strong> Navegue pelo site
                      e adicione os produtos desejados ao carrinho.
                    </li>
                    <li>
                      <strong>Revise seu carrinho:</strong> Confira os itens,
                      quantidades e valores antes de finalizar.
                    </li>
                    <li>
                      <strong>Faça login ou cadastre-se:</strong> É necessário
                      ter uma conta para finalizar a compra.
                    </li>
                    <li>
                      <strong>Informe o endereço de entrega:</strong> Adicione
                      ou selecione o endereço onde deseja receber.
                    </li>
                    <li>
                      <strong>Escolha a forma de pagamento:</strong> Selecione
                      entre cartão de crédito, PIX ou boleto.
                    </li>
                    <li>
                      <strong>Confirme o pedido:</strong> Revise todos os dados
                      e finalize sua compra.
                    </li>
                  </ol>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>💡 Dica:</strong> Cadastre-se para acompanhar seus
                    pedidos e receber ofertas exclusivas!
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Trocas e Devoluções */}
          <section id="trocas" className="scroll-mt-24">
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <RefreshCw className="h-6 w-6 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900">
                  Trocas e Devoluções
                </h2>
              </div>
              <div className="space-y-6 text-zinc-600">
                <div>
                  <h3 className="font-semibold text-zinc-900 mb-3">
                    Política de Trocas
                  </h3>
                  <p className="mb-4">
                    Você tem até <strong>30 dias</strong> após o recebimento
                    para solicitar a troca ou devolução do produto.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-zinc-900 mb-3">
                    Condições para Troca
                  </h3>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Produto sem uso e com etiquetas originais</li>
                    <li>Embalagem original intacta</li>
                    <li>Nota fiscal e todos os acessórios</li>
                    <li>Produto sem sinais de mau uso</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-zinc-900 mb-3">
                    Como Solicitar
                  </h3>
                  <ol className="space-y-2 list-decimal list-inside">
                    <li>Acesse sua conta e vá em &quot;Meus Pedidos&quot;</li>
                    <li>Selecione o pedido e clique em &quot;Solicitar Troca&quot;</li>
                    <li>Escolha o motivo e aguarde a aprovação</li>
                    <li>
                      Após aprovado, envie o produto com a etiqueta fornecida
                    </li>
                    <li>Receba o produto trocado ou o reembolso</li>
                  </ol>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>⚠️ Importante:</strong> O frete da devolução é
                    gratuito para produtos com defeito. Para arrependimento, o
                    custo do frete é por conta do cliente.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Rastreamento */}
          <section id="rastreamento" className="scroll-mt-24">
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900">
                  Rastreamento de Pedidos
                </h2>
              </div>
              <div className="space-y-6 text-zinc-600">
                <div>
                  <h3 className="font-semibold text-zinc-900 mb-3">
                    Como Rastrear seu Pedido
                  </h3>
                  <ol className="space-y-3 list-decimal list-inside">
                    <li>
                      Acesse sua conta e vá em <strong>&quot;Meus Pedidos&quot;</strong>
                    </li>
                    <li>Selecione o pedido que deseja rastrear</li>
                    <li>
                      Clique no código de rastreamento para ver os detalhes
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold text-zinc-900 mb-3">
                    Prazos de Entrega
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 border border-zinc-200 rounded-lg p-4">
                      <Truck className="h-5 w-5 text-[#022044] mt-0.5" />
                      <div>
                        <p className="font-medium text-zinc-900">
                          Região Sudeste
                        </p>
                        <p className="text-sm">3 a 7 dias úteis</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 border border-zinc-200 rounded-lg p-4">
                      <Truck className="h-5 w-5 text-[#022044] mt-0.5" />
                      <div>
                        <p className="font-medium text-zinc-900">
                          Demais Regiões
                        </p>
                        <p className="text-sm">7 a 15 dias úteis</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>✓ Frete Grátis:</strong> Para compras acima de R$
                    199,00 para todo o Brasil!
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Formas de Pagamento */}
          <section id="pagamento" className="scroll-mt-24">
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900">
                  Formas de Pagamento
                </h2>
              </div>
              <div className="space-y-6 text-zinc-600">
                <div>
                  <h3 className="font-semibold text-zinc-900 mb-4">
                    Aceitamos:
                  </h3>
                  <div className="space-y-4">
                    <div className="border border-zinc-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CreditCard className="h-5 w-5 text-[#022044] mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-zinc-900 mb-1">
                            Cartão de Crédito
                          </h4>
                          <p className="text-sm mb-2">
                            Visa, Mastercard, Elo, American Express
                          </p>
                          <p className="text-sm text-green-600 font-medium">
                            ✓ Parcelamento em até 12x sem juros
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-zinc-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-[#022044] mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-zinc-900 mb-1">
                            PIX
                          </h4>
                          <p className="text-sm mb-2">
                            Pagamento instantâneo via QR Code
                          </p>
                          <p className="text-sm text-green-600 font-medium">
                            ✓ Aprovação imediata
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-zinc-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Package className="h-5 w-5 text-[#022044] mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-zinc-900 mb-1">
                            Boleto Bancário
                          </h4>
                          <p className="text-sm mb-2">
                            Pagamento à vista com vencimento em 3 dias úteis
                          </p>
                          <p className="text-sm text-amber-600 font-medium">
                            ⚠️ Aguardar compensação bancária
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>🔒 Segurança:</strong> Todos os pagamentos são
                    processados de forma segura e seus dados são protegidos com
                    criptografia SSL.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
