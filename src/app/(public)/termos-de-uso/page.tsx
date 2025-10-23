export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Termos de Uso
          </h1>
          <p className="text-gray-600">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Aceitação dos Termos
            </h2>
            <p className="text-gray-700">
              Ao acessar e utilizar a plataforma BRICKS, você concorda em
              cumprir estes Termos de Uso. Se você não concordar, não deverá
              utilizar nossa plataforma.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Cadastro e Conta de Usuário
            </h2>
            <p className="text-gray-700 mb-4">
              Ao criar uma conta na BRICKS, você concorda em:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Fornecer informações verdadeiras e precisas</li>
              <li>Manter suas informações atualizadas</li>
              <li>Manter a confidencialidade de sua senha</li>
              <li>Ser responsável por todas as atividades em sua conta</li>
              <li>Ter no mínimo 18 anos</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Produtos e Preços
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Todos os preços estão em Reais (BRL) e incluem impostos</li>
              <li>
                Reservamo-nos o direito de alterar preços sem aviso prévio
              </li>
              <li>A disponibilidade dos produtos pode variar</li>
              <li>Imagens são ilustrativas</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Processo de Compra
            </h2>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Confirmação de Pedido
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Você receberá um e-mail de confirmação</li>
                <li>A confirmação não garante a disponibilidade</li>
                <li>Reservamos o direito de recusar pedidos</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Pagamento
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Aceitamos cartão de crédito, PIX e boleto</li>
                <li>Parcelamento em até 12x sem juros</li>
                <li>PIX tem aprovação instantânea</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Entrega e Frete
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Prazos de entrega são estimados</li>
              <li>Frete grátis acima de R$ 199,00</li>
              <li>Entregas em dias úteis (segunda a sexta)</li>
              <li>É necessário haver alguém para receber</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Trocas e Devoluções
            </h2>
            <p className="text-gray-700 mb-4">
              Você tem até 30 dias após o recebimento para solicitar troca ou
              devolução:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Produto em perfeitas condições, sem uso</li>
              <li>Com etiquetas e embalagem originais</li>
              <li>Acompanhado de nota fiscal</li>
            </ul>
            <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-500">
              <p className="text-sm text-gray-700">
                <strong>Importante:</strong> O frete de devolução é gratuito
                para produtos com defeito. Para arrependimento, o custo é por
                conta do cliente.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Propriedade Intelectual
            </h2>
            <p className="text-gray-700">
              Todo o conteúdo da plataforma BRICKS é protegido por leis de
              direitos autorais. É proibido copiar, reproduzir ou modificar sem
              autorização.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Limitação de Responsabilidade
            </h2>
            <p className="text-gray-700 mb-4">
              A BRICKS não se responsabiliza por:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Danos indiretos do uso da plataforma</li>
              <li>Interrupções ou erros no funcionamento</li>
              <li>Perda de dados</li>
              <li>Problemas causados por transportadoras</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Lei Aplicável
            </h2>
            <p className="text-gray-700">
              Estes termos são regidos pelas leis brasileiras. Qualquer disputa
              será resolvida no foro de São Paulo, SP.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Alterações nos Termos
            </h2>
            <p className="text-gray-700">
              Podemos modificar estes termos a qualquer momento. As alterações
              entram em vigor imediatamente após a publicação.
            </p>
          </section>

          {/* Contact */}
          <div className="mt-16 p-8 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Dúvidas sobre os Termos?
            </h3>
            <p className="text-gray-700 mb-4">
              Entre em contato conosco para esclarecer qualquer dúvida.
            </p>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>E-mail:</strong> contato@bricks.com.br
              </p>
              <p>
                <strong>Telefone:</strong> (11) 4002-8922
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
