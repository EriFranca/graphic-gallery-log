import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gavel, Clock } from "lucide-react";

const auctions = [
  {
    title: "Amazing Spider-Man #1 (1963)",
    publisher: "Marvel Comics",
    currentBid: "R$ 125.000",
    endDate: "2 dias",
    image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=600&fit=crop",
    condition: "9.0 VF/NM",
  },
  {
    title: "Batman #1 (1940)",
    publisher: "DC Comics",
    currentBid: "R$ 85.000",
    endDate: "5 dias",
    image: "https://images.unsplash.com/photo-1608889476561-6242cfdbf622?w=400&h=600&fit=crop",
    condition: "8.5 VF+",
  },
  {
    title: "X-Men #1 (1963)",
    publisher: "Marvel Comics",
    currentBid: "R$ 67.500",
    endDate: "3 dias",
    image: "https://images.unsplash.com/photo-1612036782143-e28a6f46e69f?w=400&h=600&fit=crop",
    condition: "9.2 NM-",
  },
  {
    title: "Action Comics #252 (1959)",
    publisher: "DC Comics",
    currentBid: "R$ 45.000",
    endDate: "1 dia",
    image: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=400&h=600&fit=crop",
    condition: "8.0 VF",
  },
  {
    title: "Fantastic Four #1 (1961)",
    publisher: "Marvel Comics",
    currentBid: "R$ 95.000",
    endDate: "4 dias",
    image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=600&fit=crop",
    condition: "9.4 NM",
  },
  {
    title: "Detective Comics #27 Reprint",
    publisher: "DC Comics",
    currentBid: "R$ 12.500",
    endDate: "6 dias",
    image: "https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?w=400&h=600&fit=crop",
    condition: "7.5 VF-",
  },
];

const Curiosidades = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-slide-in">
          <div className="inline-flex items-center justify-center p-3 bg-accent rounded-full mb-4 shadow-comic">
            <Gavel className="h-8 w-8 text-accent-foreground" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 text-foreground">
            LEILÕES
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Participe dos leilões de quadrinhos raros e valiosos!
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {auctions.map((auction, index) => (
            <Card 
              key={index} 
              className="shadow-comic hover:shadow-comic-hover transition-all duration-300 hover:-translate-y-1 bg-gradient-card border-2 overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="aspect-[2/3] overflow-hidden">
                <img 
                  src={auction.image} 
                  alt={auction.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-primary font-black text-lg leading-tight">
                    {auction.title}
                  </CardTitle>
                  <Badge variant="secondary" className="shrink-0">
                    {auction.condition}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{auction.publisher}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Lance Atual:</span>
                  <span className="text-xl font-black text-primary">{auction.currentBid}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Termina em {auction.endDate}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Curiosidades;
