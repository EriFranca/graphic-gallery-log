import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

const curiosities = [
  {
    title: "Superman quase se chamou 'Super-Man'",
    description: "Nos primeiros esboços de Jerry Siegel e Joe Shuster, o herói era escrito como 'Super-Man' (com hífen). O nome foi simplificado para 'Superman' quando foi publicado pela primeira vez em Action Comics #1 em 1938.",
  },
  {
    title: "A primeira HQ custava 10 centavos",
    description: "Action Comics #1, que introduziu o Superman, custava apenas 10 centavos em 1938. Hoje, uma cópia em bom estado pode valer milhões de dólares!",
  },
  {
    title: "Stan Lee criou os X-Men por preguiça",
    description: "Stan Lee estava cansado de criar origens elaboradas para super-poderes. Então criou os mutantes, que simplesmente nasciam com seus poderes. Foi assim que surgiram os X-Men!",
  },
  {
    title: "Batman foi quase cancelado",
    description: "Nos anos 1960, Batman estava perdendo popularidade até que a série de TV com Adam West se tornou um fenômeno. As vendas das HQs dispararam e salvaram o personagem.",
  },
  {
    title: "O Código de Ética das HQs",
    description: "Em 1954, foi criado o Comics Code Authority, que censurava conteúdo considerado inapropriado. Isso mudou drasticamente o tom dos quadrinhos por décadas, eliminando histórias de horror e crime.",
  },
  {
    title: "A primeira graphic novel",
    description: "Em 1978, 'A Contract with God' de Will Eisner foi considerada a primeira graphic novel. Eisner inclusive popularizou o termo para diferenciar obras mais maduras dos comic books tradicionais.",
  },
  {
    title: "Wolverine era para ser um vilão",
    description: "Wolverine foi originalmente criado para ser um vilão recorrente do Hulk. Sua primeira aparição foi em 'The Incredible Hulk #180' em 1974, antes de se juntar aos X-Men.",
  },
  {
    title: "O maior colecionador do mundo",
    description: "Bob Bretall detém o Recorde Mundial do Guinness pela maior coleção de quadrinhos, com mais de 100.000 exemplares! Ele começou sua coleção em 1970.",
  },
];

const Curiosidades = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-slide-in">
          <div className="inline-flex items-center justify-center p-3 bg-accent rounded-full mb-4 shadow-comic">
            <Lightbulb className="h-8 w-8 text-accent-foreground" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 text-foreground">
            CURIOSIDADES
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Descubra fatos fascinantes sobre o mundo dos quadrinhos!
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {curiosities.map((curiosity, index) => (
            <Card 
              key={index} 
              className="shadow-comic hover:shadow-comic-hover transition-all duration-300 hover:-translate-y-1 bg-gradient-card border-2"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <CardTitle className="text-primary font-black text-xl">
                  {curiosity.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-foreground/80">
                  {curiosity.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Curiosidades;
