import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Shield, Truck, Heart } from "lucide-react";

export default function Sobre() {
  const features = [
    {
      icon: Package,
      title: "Produtos de Qualidade",
      description:
        "Blocos de construção dos seus personagens favoritos com alta qualidade e detalhamento.",
    },
    {
      icon: Shield,
      title: "Compra Segura",
      description:
        "Sistema de pagamento seguro e proteção de dados para suas compras.",
    },
    {
      icon: Truck,
      title: "Entrega Rápida",
      description:
        "Enviamos para todo o Brasil com rapidez e rastreamento completo.",
    },
    {
      icon: Heart,
      title: "Satisfação Garantida",
      description:
        "Nosso compromisso é sua satisfação. Trabalhamos com produtos originais e de confiança.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Sobre a Loja Bricks
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Sua loja especializada em blocos de construção dos personagens mais
            amados do mundo
          </p>
        </div>

        {/* História */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">
              Nossa História
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm sm:text-base text-gray-700 space-y-3 sm:space-y-4">
            <p>
              A Loja Bricks nasceu da paixão por blocos de construção e pela
              alegria de criar. Sabemos que esses brinquedos são mais do que
              simples peças de plástico - são memórias, criatividade e diversão
              em cada encaixe.
            </p>
            <p>
              Trazemos para você uma seleção especial de sets inspirados nos
              personagens mais queridos da Disney, Pixar, Pokémon e muito mais.
              Cada produto é cuidadosamente selecionado para garantir qualidade
              e autenticidade.
            </p>
            <p>
              Nossa missão é proporcionar alegria e momentos especiais para
              colecionadores, crianças e fãs de todas as idades.
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full mb-3 sm:mb-4">
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Valores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">
              Nossos Valores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h3 className="font-semibold text-base sm:text-lg mb-2 text-purple-600">
                  Qualidade
                </h3>
                <p className="text-sm sm:text-base text-gray-700">
                  Oferecemos apenas produtos que passam por rigoroso controle de
                  qualidade.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-base sm:text-lg mb-2 text-purple-600">
                  Transparência
                </h3>
                <p className="text-sm sm:text-base text-gray-700">
                  Informações claras sobre produtos, preços e prazos de entrega.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-base sm:text-lg mb-2 text-purple-600">
                  Atendimento
                </h3>
                <p className="text-sm sm:text-base text-gray-700">
                  Equipe dedicada para tirar suas dúvidas e ajudar na melhor
                  escolha.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-base sm:text-lg mb-2 text-purple-600">
                  Paixão
                </h3>
                <p className="text-sm sm:text-base text-gray-700">
                  Amamos o que fazemos e isso reflete em cada detalhe do nosso
                  serviço.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
