import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, Library } from "lucide-react";
import { toast } from "sonner";

interface Comic {
  id: string;
  title: string;
  issue: string;
  publisher: string;
  owned: boolean;
}

const initialComics: Comic[] = [
  { id: "1", title: "Amazing Spider-Man", issue: "#1", publisher: "Marvel", owned: false },
  { id: "2", title: "Batman: The Dark Knight", issue: "#1", publisher: "DC", owned: false },
  { id: "3", title: "X-Men", issue: "#1", publisher: "Marvel", owned: true },
  { id: "4", title: "Watchmen", issue: "#1", publisher: "DC", owned: false },
  { id: "5", title: "The Walking Dead", issue: "#1", publisher: "Image", owned: true },
  { id: "6", title: "Superman: Man of Steel", issue: "#1", publisher: "DC", owned: false },
];

const Colecao = () => {
  const [comics, setComics] = useState<Comic[]>(initialComics);
  const [searchTerm, setSearchTerm] = useState("");
  const [newComicTitle, setNewComicTitle] = useState("");
  const [newComicIssue, setNewComicIssue] = useState("");
  const [newComicPublisher, setNewComicPublisher] = useState("");

  const toggleOwned = (id: string) => {
    setComics(comics.map(comic => 
      comic.id === id ? { ...comic, owned: !comic.owned } : comic
    ));
    toast.success("Coleção atualizada!");
  };

  const addComic = () => {
    if (!newComicTitle || !newComicIssue) {
      toast.error("Preencha o título e edição!");
      return;
    }
    
    const newComic: Comic = {
      id: Date.now().toString(),
      title: newComicTitle,
      issue: newComicIssue,
      publisher: newComicPublisher || "Desconhecido",
      owned: false,
    };
    
    setComics([...comics, newComic]);
    setNewComicTitle("");
    setNewComicIssue("");
    setNewComicPublisher("");
    toast.success("Quadrinho adicionado!");
  };

  const filteredComics = comics.filter(comic =>
    comic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comic.publisher.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ownedCount = comics.filter(c => c.owned).length;
  const totalCount = comics.length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-slide-in">
          <div className="inline-flex items-center justify-center p-3 bg-primary rounded-full mb-4 shadow-comic">
            <Library className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 text-foreground">
            MINHA COLEÇÃO
          </h1>
          <p className="text-xl text-muted-foreground">
            Você possui <span className="text-primary font-bold">{ownedCount}</span> de <span className="font-bold">{totalCount}</span> quadrinhos
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          <Card className="shadow-comic border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-primary">Adicionar Novo Quadrinho</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <Input
                  placeholder="Título"
                  value={newComicTitle}
                  onChange={(e) => setNewComicTitle(e.target.value)}
                  className="border-2"
                />
                <Input
                  placeholder="Edição (ex: #1)"
                  value={newComicIssue}
                  onChange={(e) => setNewComicIssue(e.target.value)}
                  className="border-2"
                />
                <Input
                  placeholder="Editora"
                  value={newComicPublisher}
                  onChange={(e) => setNewComicPublisher(e.target.value)}
                  className="border-2"
                />
                <Button 
                  onClick={addComic}
                  className="shadow-comic hover:shadow-comic-hover transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar na coleção..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2 shadow-comic"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredComics.map((comic) => (
              <Card 
                key={comic.id}
                className={`shadow-comic hover:shadow-comic-hover transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 ${
                  comic.owned ? "bg-gradient-accent" : "bg-gradient-card"
                }`}
                onClick={() => toggleOwned(comic.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={comic.owned}
                      onCheckedChange={() => toggleOwned(comic.id)}
                      className="mt-1 border-2"
                    />
                    <div className="flex-1">
                      <h3 className="font-black text-lg mb-1">{comic.title}</h3>
                      <p className="text-sm text-muted-foreground font-bold">
                        {comic.issue} • {comic.publisher}
                      </p>
                      {comic.owned && (
                        <p className="text-xs font-bold text-primary mt-2">✓ NA COLEÇÃO</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Colecao;
