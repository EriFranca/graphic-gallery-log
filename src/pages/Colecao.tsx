import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, Library, BookOpen, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Issue {
  id: string;
  number: string;
  owned: boolean;
  coverColor: string;
}

interface Collection {
  id: string;
  title: string;
  publisher: string;
  issues: Issue[];
}

const generateCoverColor = () => {
  const colors = [
    "bg-gradient-to-br from-red-500 to-red-700",
    "bg-gradient-to-br from-blue-500 to-blue-700",
    "bg-gradient-to-br from-yellow-500 to-yellow-700",
    "bg-gradient-to-br from-green-500 to-green-700",
    "bg-gradient-to-br from-purple-500 to-purple-700",
    "bg-gradient-to-br from-orange-500 to-orange-700",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const initialCollections: Collection[] = [
  {
    id: "1",
    title: "Novos Titãs",
    publisher: "Abril",
    issues: [
      { id: "1-1", number: "#1", owned: true, coverColor: "bg-gradient-to-br from-red-500 to-red-700" },
      { id: "1-2", number: "#2", owned: true, coverColor: "bg-gradient-to-br from-blue-500 to-blue-700" },
      { id: "1-3", number: "#3", owned: false, coverColor: "bg-gradient-to-br from-yellow-500 to-yellow-700" },
      { id: "1-4", number: "#4", owned: false, coverColor: "bg-gradient-to-br from-green-500 to-green-700" },
      { id: "1-5", number: "#5", owned: true, coverColor: "bg-gradient-to-br from-purple-500 to-purple-700" },
    ],
  },
  {
    id: "2",
    title: "Homem-Aranha",
    publisher: "Panini",
    issues: [
      { id: "2-1", number: "#1", owned: true, coverColor: "bg-gradient-to-br from-red-500 to-red-700" },
      { id: "2-2", number: "#2", owned: false, coverColor: "bg-gradient-to-br from-blue-500 to-blue-700" },
      { id: "2-3", number: "#3", owned: true, coverColor: "bg-gradient-to-br from-yellow-500 to-yellow-700" },
    ],
  },
  {
    id: "3",
    title: "Batman",
    publisher: "Panini",
    issues: [
      { id: "3-1", number: "#1", owned: false, coverColor: "bg-gradient-to-br from-gray-700 to-gray-900" },
      { id: "3-2", number: "#2", owned: false, coverColor: "bg-gradient-to-br from-blue-500 to-blue-900" },
      { id: "3-3", number: "#3", owned: true, coverColor: "bg-gradient-to-br from-yellow-500 to-yellow-700" },
      { id: "3-4", number: "#4", owned: false, coverColor: "bg-gradient-to-br from-purple-500 to-purple-700" },
    ],
  },
];

const Colecao = () => {
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCollectionTitle, setNewCollectionTitle] = useState("");
  const [newCollectionPublisher, setNewCollectionPublisher] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [newIssueNumber, setNewIssueNumber] = useState("");
  const [scrapingQuery, setScrapingQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const toggleIssueOwned = (collectionId: string, issueId: string) => {
    setCollections(collections.map(collection => {
      if (collection.id === collectionId) {
        return {
          ...collection,
          issues: collection.issues.map(issue =>
            issue.id === issueId ? { ...issue, owned: !issue.owned } : issue
          ),
        };
      }
      return collection;
    }));
    toast.success("Coleção atualizada!");
  };

  const addCollection = () => {
    if (!newCollectionTitle) {
      toast.error("Preencha o título da coleção!");
      return;
    }
    
    const newCollection: Collection = {
      id: Date.now().toString(),
      title: newCollectionTitle,
      publisher: newCollectionPublisher || "Desconhecido",
      issues: [],
    };
    
    setCollections([...collections, newCollection]);
    setNewCollectionTitle("");
    setNewCollectionPublisher("");
    toast.success("Coleção adicionada!");
  };

  const addIssue = () => {
    if (!selectedCollectionId || !newIssueNumber) {
      toast.error("Selecione uma coleção e preencha o número da edição!");
      return;
    }

    setCollections(collections.map(collection => {
      if (collection.id === selectedCollectionId) {
        const newIssue: Issue = {
          id: `${collection.id}-${Date.now()}`,
          number: newIssueNumber,
          owned: false,
          coverColor: generateCoverColor(),
        };
        return {
          ...collection,
          issues: [...collection.issues, newIssue],
        };
      }
      return collection;
    }));

    setNewIssueNumber("");
    toast.success("Edição adicionada!");
  };

  const scrapeGuiaQuadrinhos = async () => {
    if (!scrapingQuery.trim()) {
      toast.error("Digite um título para buscar!");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-guia-quadrinhos', {
        body: { searchQuery: scrapingQuery }
      });

      if (error) throw error;

      if (data.success && data.data.length > 0) {
        toast.success(`${data.data.length} resultados encontrados no Guia dos Quadrinhos!`);
        console.log('Resultados:', data.data);
        
        // Aqui você pode processar os resultados
        // Por exemplo, adicionar automaticamente como uma nova coleção
        const firstResult = data.data[0];
        toast.info(`Título encontrado: ${firstResult.title}`);
      } else {
        toast.warning("Nenhum resultado encontrado");
      }
    } catch (error) {
      console.error('Erro ao fazer scraping:', error);
      toast.error("Erro ao buscar no Guia dos Quadrinhos");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCollections = collections.filter(collection =>
    collection.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.publisher.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalIssues = collections.reduce((acc, col) => acc + col.issues.length, 0);
  const ownedIssues = collections.reduce(
    (acc, col) => acc + col.issues.filter(i => i.owned).length,
    0
  );

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
            Você possui <span className="text-primary font-bold">{ownedIssues}</span> de <span className="font-bold">{totalIssues}</span> edições
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          <Card className="shadow-comic border-2 bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardHeader>
              <CardTitle className="text-xl font-black text-foreground flex items-center gap-2">
                <Download className="h-5 w-5" />
                Buscar no Guia dos Quadrinhos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Digite o título da coleção..."
                  value={scrapingQuery}
                  onChange={(e) => setScrapingQuery(e.target.value)}
                  className="border-2 flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && scrapeGuiaQuadrinhos()}
                />
                <Button 
                  onClick={scrapeGuiaQuadrinhos}
                  disabled={isLoading}
                  className="shadow-comic hover:shadow-comic-hover transition-all duration-300 hover:-translate-y-0.5"
                >
                  {isLoading ? "Buscando..." : "Buscar"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-comic border-2">
              <CardHeader>
                <CardTitle className="text-xl font-black text-primary">Nova Coleção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Input
                    placeholder="Título (ex: Novos Titãs)"
                    value={newCollectionTitle}
                    onChange={(e) => setNewCollectionTitle(e.target.value)}
                    className="border-2"
                  />
                  <Input
                    placeholder="Editora (ex: Abril)"
                    value={newCollectionPublisher}
                    onChange={(e) => setNewCollectionPublisher(e.target.value)}
                    className="border-2"
                  />
                  <Button 
                    onClick={addCollection}
                    className="w-full shadow-comic hover:shadow-comic-hover transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Coleção
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-comic border-2">
              <CardHeader>
                <CardTitle className="text-xl font-black text-secondary">Nova Edição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <select
                    value={selectedCollectionId}
                    onChange={(e) => setSelectedCollectionId(e.target.value)}
                    className="w-full px-3 py-2 border-2 rounded-lg bg-background text-foreground"
                  >
                    <option value="">Selecione uma coleção</option>
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.title} ({col.publisher})
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Número da edição (ex: #1)"
                    value={newIssueNumber}
                    onChange={(e) => setNewIssueNumber(e.target.value)}
                    className="border-2"
                  />
                  <Button 
                    onClick={addIssue}
                    variant="secondary"
                    className="w-full shadow-comic hover:shadow-comic-hover transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Edição
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar coleção..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2 shadow-comic"
            />
          </div>

          <div className="space-y-4">
            {filteredCollections.length === 0 ? (
              <Card className="shadow-comic border-2 p-8 text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-xl text-muted-foreground">Nenhuma coleção encontrada</p>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-4">
                {filteredCollections.map((collection) => {
                  const ownedInCollection = collection.issues.filter(i => i.owned).length;
                  const totalInCollection = collection.issues.length;
                  
                  return (
                    <AccordionItem 
                      key={collection.id} 
                      value={collection.id}
                      className="border-2 rounded-lg shadow-comic hover:shadow-comic-hover transition-all duration-300 bg-card overflow-hidden"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="text-left">
                            <h3 className="text-2xl font-black text-foreground mb-1">
                              {collection.title}
                            </h3>
                            <p className="text-sm text-muted-foreground font-bold">
                              {collection.publisher} • {ownedInCollection}/{totalInCollection} edições
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                              ownedInCollection === totalInCollection && totalInCollection > 0
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {totalInCollection > 0 
                                ? `${Math.round((ownedInCollection / totalInCollection) * 100)}%`
                                : "0%"
                              }
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6">
                        {collection.issues.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            Nenhuma edição adicionada ainda
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-4">
                            {collection.issues.map((issue) => (
                              <div
                                key={issue.id}
                                onClick={() => toggleIssueOwned(collection.id, issue.id)}
                                className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                                  issue.owned ? "opacity-100" : "opacity-50"
                                }`}
                              >
                                <div className="relative">
                                  <div className={`aspect-[2/3] ${issue.coverColor} rounded-lg shadow-comic hover:shadow-comic-hover flex items-center justify-center`}>
                                    <span className="text-white text-2xl font-black drop-shadow-lg">
                                      {issue.number}
                                    </span>
                                  </div>
                                  <div className="absolute top-2 right-2">
                                    <Checkbox
                                      checked={issue.owned}
                                      className="bg-white border-2 shadow-md"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleIssueOwned(collection.id, issue.id);
                                      }}
                                    />
                                  </div>
                                  {issue.owned && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-lg">
                                      <div className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-black">
                                        ✓ TENHO
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Colecao;
