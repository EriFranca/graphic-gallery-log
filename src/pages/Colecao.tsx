import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, Library, BookOpen, Download, Trash2, CheckSquare, Square, ChevronLeft, ChevronRight, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
  coverUrl?: string;
  name?: string;
  conditionRating?: number;
}

interface Collection {
  id: string;
  title: string;
  publisher: string;
  issues: Issue[];
  coverUrl?: string;
}

interface ComicVineResult {
  title: string;
  publisher: string;
  year: string;
  issueCount: number;
  coverUrl: string;
  description: string;
  link: string;
  apiUrl: string;
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
  const [searchResults, setSearchResults] = useState<ComicVineResult[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const searchComicVine = async () => {
    if (!scrapingQuery.trim()) {
      toast.error("Digite um título para buscar!");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-comic-vine', {
        body: { searchQuery: scrapingQuery }
      });

      if (error) throw error;

      if (data.success && data.data.length > 0) {
        setSearchResults(data.data);
        toast.success(`${data.data.length} resultados encontrados!`);
      } else {
        setSearchResults([]);
        toast.warning("Nenhum resultado encontrado");
      }
    } catch (error) {
      console.error('Erro ao buscar:', error);
      toast.error("Erro ao buscar no Comic Vine");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addCollectionFromComicVine = async (result: ComicVineResult) => {
    setIsLoading(true);
    toast.info("Buscando capas das edições...");
    
    try {
      // Fetch issues with covers
      const { data, error } = await supabase.functions.invoke('search-comic-vine', {
        body: { volumeApiUrl: result.apiUrl }
      });

      if (error) throw error;

      let issues: Issue[] = [];
      
      if (data.success && data.data.length > 0) {
        // Use real covers from Comic Vine
        issues = data.data.map((issue: any, index: number) => ({
          id: `${Date.now()}-${index}`,
          number: issue.number,
          name: issue.name,
          owned: false,
          coverColor: generateCoverColor(),
          coverUrl: issue.coverUrl,
        }));
      } else {
        // Fallback to numbered issues without covers
        for (let i = 1; i <= result.issueCount; i++) {
          issues.push({
            id: `${Date.now()}-${i}`,
            number: `#${i}`,
            owned: false,
            coverColor: generateCoverColor(),
          });
        }
      }

      const newCollection: Collection = {
        id: Date.now().toString(),
        title: result.title,
        publisher: result.publisher,
        issues: issues,
        coverUrl: result.coverUrl,
      };
      
      setCollections([...collections, newCollection]);
      toast.success(`${result.title} adicionado com ${issues.length} edições!`);
      setSearchResults([]);
      setScrapingQuery("");
    } catch (error) {
      console.error('Erro ao buscar edições:', error);
      toast.error("Erro ao buscar capas das edições");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCollection = (collectionId: string) => {
    setCollections(collections.filter(col => col.id !== collectionId));
    toast.success("Coleção removida!");
  };

  const toggleAllIssues = (collectionId: string, ownedStatus: boolean) => {
    setCollections(collections.map(collection => {
      if (collection.id === collectionId) {
        return {
          ...collection,
          issues: collection.issues.map(issue => ({ ...issue, owned: ownedStatus })),
        };
      }
      return collection;
    }));
    toast.success(ownedStatus ? "Todas marcadas como possuídas!" : "Todas desmarcadas!");
  };

  const handleIssueClick = (issue: Issue, collection: Collection) => {
    setSelectedIssue(issue);
    setSelectedCollection(collection);
    setIsDialogOpen(true);
  };

  const navigateIssue = (direction: 'prev' | 'next') => {
    if (!selectedCollection || !selectedIssue) return;
    
    const currentIndex = selectedCollection.issues.findIndex(i => i.id === selectedIssue.id);
    let newIndex = currentIndex;
    
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < selectedCollection.issues.length - 1) {
      newIndex = currentIndex + 1;
    }
    
    if (newIndex !== currentIndex) {
      setSelectedIssue(selectedCollection.issues[newIndex]);
    }
  };

  const updateConditionRating = (collectionId: string, issueId: string, rating: number) => {
    setCollections(collections.map(collection => {
      if (collection.id === collectionId) {
        return {
          ...collection,
          issues: collection.issues.map(issue =>
            issue.id === issueId ? { ...issue, conditionRating: rating } : issue
          ),
        };
      }
      return collection;
    }));
    if (selectedIssue && selectedIssue.id === issueId) {
      setSelectedIssue({ ...selectedIssue, conditionRating: rating });
    }
    toast.success("Avaliação de conservação atualizada!");
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
                Buscar no Comic Vine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Digite o título da coleção..."
                  value={scrapingQuery}
                  onChange={(e) => setScrapingQuery(e.target.value)}
                  className="border-2 flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && searchComicVine()}
                />
                <Button 
                  onClick={searchComicVine}
                  disabled={isLoading}
                  className="shadow-comic hover:shadow-comic-hover transition-all duration-300 hover:-translate-y-0.5"
                >
                  {isLoading ? "Buscando..." : "Buscar"}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <p className="text-sm font-bold text-muted-foreground">
                    {searchResults.length} resultados encontrados:
                  </p>
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex gap-3 p-3 border-2 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <img
                        src={result.coverUrl}
                        alt={result.title}
                        className="w-16 h-24 object-cover rounded shadow-md"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground truncate">
                          {result.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {result.publisher} • {result.year}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {result.issueCount} edições
                        </p>
                      </div>
                      <Button
                        onClick={() => addCollectionFromComicVine(result)}
                        size="sm"
                        className="shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
                  const ratedIssues = collection.issues.filter(i => i.conditionRating);
                  const averageRating = ratedIssues.length > 0 
                    ? ratedIssues.reduce((sum, i) => sum + (i.conditionRating || 0), 0) / ratedIssues.length 
                    : null;
                  
                  return (
                    <AccordionItem 
                      key={collection.id} 
                      value={collection.id}
                      className="border-2 rounded-lg shadow-comic hover:shadow-comic-hover transition-all duration-300 bg-card overflow-hidden"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="text-left">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-2xl font-black text-foreground">
                                {collection.title}
                              </h3>
                              {averageRating && (
                                <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-bold text-foreground">
                                    {averageRating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground font-bold">
                              {collection.publisher} • {ownedInCollection}/{totalInCollection} edições
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCollection(collection.id);
                              }}
                              className="mr-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                          <>
                            <div className="flex gap-2 mb-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleAllIssues(collection.id, true)}
                                className="flex-1"
                              >
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Marcar todas
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleAllIssues(collection.id, false)}
                                className="flex-1"
                              >
                                <Square className="h-4 w-4 mr-2" />
                                Desmarcar todas
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                              {collection.issues.map((issue) => (
                                <div
                                  key={issue.id}
                                  onClick={() => handleIssueClick(issue, collection)}
                                  className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                                    issue.owned ? "opacity-100" : "opacity-50"
                                  }`}
                                >
                                   <div className="space-y-2">
                                     {issue.coverUrl ? (
                                       <img
                                         src={issue.coverUrl}
                                         alt={issue.number}
                                         className="aspect-[2/3] w-full object-cover rounded-lg shadow-comic hover:shadow-comic-hover"
                                         onError={(e) => {
                                           console.error('Erro ao carregar imagem:', issue.coverUrl);
                                           const target = e.currentTarget;
                                           target.style.display = 'none';
                                           const fallback = target.nextElementSibling as HTMLElement;
                                           if (fallback) {
                                             fallback.classList.remove('hidden');
                                           }
                                         }}
                                       />
                                     ) : null}
                                     <div 
                                       className={`aspect-[2/3] ${issue.coverColor} rounded-lg shadow-comic hover:shadow-comic-hover flex items-center justify-center ${issue.coverUrl ? 'hidden' : ''}`}
                                     >
                                       <span className="text-white text-2xl font-black drop-shadow-lg">
                                         {issue.number}
                                       </span>
                                     </div>
                                     <div className="space-y-1">
                                       <div className="flex items-center gap-2">
                                         <Checkbox
                                           checked={issue.owned}
                                           className="border-2"
                                           onClick={(e) => {
                                             e.stopPropagation();
                                             toggleIssueOwned(collection.id, issue.id);
                                           }}
                                         />
                                         <span className="text-sm font-bold text-foreground">
                                           {issue.number}
                                         </span>
                                       </div>
                                       {issue.conditionRating && (
                                         <div className="flex gap-0.5 ml-1">
                                           {[1, 2, 3, 4, 5].map((rating) => (
                                             <Star
                                               key={rating}
                                               className={`h-3 w-3 ${
                                                 rating <= issue.conditionRating!
                                                   ? "fill-yellow-400 text-yellow-400"
                                                   : "text-muted-foreground"
                                               }`}
                                             />
                                           ))}
                                         </div>
                                       )}
                                     </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {selectedCollection?.title} - Edição {selectedIssue?.number}
            </DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-6 pb-4">
            {/* Left side - Cover */}
            <div className="space-y-4">
              <div className="relative mx-auto max-w-sm">
                {selectedIssue?.coverUrl ? (
                  <img
                    src={selectedIssue.coverUrl}
                    alt={selectedIssue.number}
                    className="w-full aspect-[2/3] object-cover rounded-lg shadow-comic"
                    onError={(e) => {
                      console.error('Erro ao carregar imagem:', selectedIssue.coverUrl);
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.classList.remove('hidden');
                      }
                    }}
                  />
                ) : null}
                <div 
                  className={`w-full aspect-[2/3] ${selectedIssue?.coverColor} rounded-lg shadow-comic flex items-center justify-center ${selectedIssue?.coverUrl ? 'hidden' : ''}`}
                >
                  <span className="text-white text-6xl font-black drop-shadow-lg">
                    {selectedIssue?.number}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Checkbox
                  checked={selectedIssue?.owned}
                  onCheckedChange={() => {
                    if (selectedCollection && selectedIssue) {
                      toggleIssueOwned(selectedCollection.id, selectedIssue.id);
                      setSelectedIssue({ ...selectedIssue, owned: !selectedIssue.owned });
                    }
                  }}
                  className="border-2 h-5 w-5"
                />
                <span className="text-lg font-bold text-foreground">
                  {selectedIssue?.owned ? "✓ Tenho esta edição" : "Não tenho esta edição"}
                </span>
              </div>
            </div>

            {/* Right side - Information */}
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-muted-foreground text-sm mb-2">Coleção:</h4>
                <p className="text-xl font-bold text-foreground">{selectedCollection?.title}</p>
                <p className="text-sm text-muted-foreground">{selectedCollection?.publisher}</p>
              </div>

              <div>
                <h4 className="font-bold text-muted-foreground text-sm mb-2">Edição:</h4>
                <p className="text-lg font-bold text-foreground">{selectedIssue?.number}</p>
              </div>

              {selectedIssue?.name && (
                <div>
                  <h4 className="font-bold text-muted-foreground text-sm mb-2">Título:</h4>
                  <p className="text-foreground">{selectedIssue.name}</p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-muted-foreground text-sm mb-2">Status:</h4>
                <p className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                  selectedIssue?.owned 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {selectedIssue?.owned ? "✓ Tenho" : "Não tenho"}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-muted-foreground text-sm mb-2">Estado de Conservação:</h4>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => {
                        if (selectedCollection && selectedIssue) {
                          updateConditionRating(selectedCollection.id, selectedIssue.id, rating);
                        }
                      }}
                      className="transition-colors hover:scale-110 transform duration-200"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          selectedIssue?.conditionRating && rating <= selectedIssue.conditionRating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedIssue?.conditionRating 
                    ? `Avaliação: ${selectedIssue.conditionRating}/5`
                    : "Clique nas estrelas para avaliar"
                  }
                </p>
              </div>

              {/* Navigation */}
              <div className="pt-4 border-t">
                <h4 className="font-bold text-muted-foreground text-sm mb-3">Navegar:</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateIssue('prev')}
                    disabled={!selectedCollection || !selectedIssue || selectedCollection.issues.findIndex(i => i.id === selectedIssue.id) === 0}
                    className="flex-1"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateIssue('next')}
                    disabled={!selectedCollection || !selectedIssue || selectedCollection.issues.findIndex(i => i.id === selectedIssue.id) === selectedCollection.issues.length - 1}
                    className="flex-1"
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Colecao;
