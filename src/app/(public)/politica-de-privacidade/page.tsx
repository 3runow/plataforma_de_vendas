export default function PoliticaDePrivacidadePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Política de Privacidade
          </h1>
          <p className="text-gray-600">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Introdução
            </h2>
            <p className="text-gray-700 mb-4">
              A BRICKS está comprometida em proteger sua privacidade e seus
              dados pessoais. Esta Política de Privacidade descreve como
              coletamos, usamos, armazenamos e protegemos suas informações
              quando você utiliza nossa plataforma.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Informações que Coletamos
            </h2>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Informações Fornecidas por Você:
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Nome completo e dados de contato</li>
                <li>Endereço de e-mail e telefone</li>
                <li>Endereços de entrega e cobrança</li>
                <li>CPF/CNPJ para emissão de nota fiscal</li>
                <li>Informações de pagamento (processadas de forma segura)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Informações Coletadas Automaticamente:
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Endereço IP e dados de localização</li>
                <li>Tipo de navegador e dispositivo utilizado</li>
                <li>Páginas visitadas e comportamento de navegação</li>
                <li>Cookies e identificadores únicos</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Como Usamos suas Informações
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Processar e gerenciar seus pedidos e pagamentos</li>
              <li>Enviar confirmações e atualizações de pedidos</li>
              <li>Melhorar e personalizar sua experiência de compra</li>
              <li>Enviar ofertas e promoções (com seu consentimento)</li>
              <li>Prevenir fraudes e garantir a segurança</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Compartilhamento de Informações
            </h2>
            <p className="text-gray-700 mb-4">
              Não vendemos suas informações pessoais. Podemos compartilhar seus
              dados apenas:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Com prestadores de serviços (transportadoras, processadores de
                pagamento)
              </li>
              <li>Quando exigido por lei ou autoridades competentes</li>
              <li>Para proteger nossos direitos legais e prevenir fraudes</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Segurança dos Dados
            </h2>
            <p className="text-gray-700 mb-4">
              Implementamos medidas de segurança para proteger suas informações:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Criptografia SSL/TLS em todas as transmissões</li>
              <li>Armazenamento seguro em servidores protegidos</li>
              <li>Controles de acesso restritos</li>
              <li>Monitoramento contínuo de segurança</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Seus Direitos (LGPD)
            </h2>
            <p className="text-gray-700 mb-4">
              De acordo com a Lei Geral de Proteção de Dados, você possui os
              seguintes direitos:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou inexatos</li>
              <li>Solicitar a exclusão de seus dados</li>
              <li>Solicitar a portabilidade de dados</li>
              <li>Revogar o consentimento a qualquer momento</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Cookies
            </h2>
            <p className="text-gray-700">
              Utilizamos cookies para melhorar sua experiência. Você pode
              gerenciar suas preferências de cookies através das configurações
              do seu navegador.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Alterações nesta Política
            </h2>
            <p className="text-gray-700">
              Podemos atualizar esta política periodicamente. Notificaremos você
              sobre alterações significativas por e-mail ou através de um aviso
              em nosso site.
            </p>
          </section>

          {/* Contact */}
          <div className="mt-16 p-8 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Dúvidas sobre Privacidade?
            </h3>
            <p className="text-gray-700 mb-4">
              Entre em contato conosco para exercer seus direitos ou esclarecer
              dúvidas.
            </p>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>E-mail:</strong> privacidade@bricks.com.br
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
