import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, Library, BookOpen, Download, Trash2, CheckSquare, Square, ChevronLeft, ChevronRight, Star, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Issue {
  id: string;
  issue_number: string;
  is_owned: boolean;
  cover_color: string;
  cover_url?: string;
  name?: string;
  condition_rating?: number;
}

interface Collection {
  id: string;
  title: string;
  publisher: string;
  cover_url?: string;
  issues: Issue[];
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

interface MetronResult {
  title: string;
  publisher: string;
  year: string;
  issueCount: number;
  coverUrl: string | null;
  description: string;
  link: string;
  seriesId: number;
}

// Alphanumeric sort function for issue numbers
const sortIssuesAlphanumeric = (issues: Issue[]) => {
  return [...issues].sort((a, b) => {
    const aNum = a.issue_number.replace(/[^\d.]/g, '');
    const bNum = b.issue_number.replace(/[^\d.]/g, '');
    const aVal = parseFloat(aNum) || 0;
    const bVal = parseFloat(bNum) || 0;
    
    if (aVal !== bVal) {
      return aVal - bVal;
    }
    return a.issue_number.localeCompare(b.issue_number);
  });
};

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

const Colecao = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCollectionTitle, setNewCollectionTitle] = useState("");
  const [newCollectionPublisher, setNewCollectionPublisher] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [newIssueNumber, setNewIssueNumber] = useState("");
  const [scrapingQuery, setScrapingQuery] = useState("");
  const [metronQuery, setMetronQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMetronLoading, setIsMetronLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ComicVineResult[]>([]);
  const [metronResults, setMetronResults] = useState<MetronResult[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load collections from database
  useEffect(() => {
    if (session?.user) {
      loadCollections();
    }
  }, [session]);

  const loadCollections = async () => {
    try {
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false });

      if (collectionsError) throw collectionsError;

      if (collectionsData) {
        const collectionsWithIssues = await Promise.all(
          collectionsData.map(async (collection) => {
            const { data: issuesData, error: issuesError } = await supabase
              .from('issues')
              .select('*')
              .eq('collection_id', collection.id);

            if (issuesError) throw issuesError;

            return {
              id: collection.id,
              title: collection.title,
              publisher: collection.publisher || "Desconhecido",
              cover_url: collection.cover_url,
              issues: sortIssuesAlphanumeric(issuesData || []),
            };
          })
        );

        setCollections(collectionsWithIssues);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
      toast.error("Erro ao carregar coleções");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const toggleIssueOwned = async (collectionId: string, issueId: string) => {
    const collection = collections.find(c => c.id === collectionId);
    const issue = collection?.issues.find(i => i.id === issueId);
    
    if (!issue) return;

    try {
      const { error } = await supabase
        .from('issues')
        .update({ is_owned: !issue.is_owned })
        .eq('id', issueId);

      if (error) throw error;

      setCollections(collections.map(collection => {
        if (collection.id === collectionId) {
          return {
            ...collection,
            issues: sortIssuesAlphanumeric(
              collection.issues.map(issue =>
                issue.id === issueId ? { ...issue, is_owned: !issue.is_owned } : issue
              )
            ),
          };
        }
        return collection;
      }));
      
      toast.success("Coleção atualizada!");
    } catch (error) {
      console.error('Error updating issue:', error);
      toast.error("Erro ao atualizar edição");
    }
  };

  const addCollection = async () => {
    if (!newCollectionTitle) {
      toast.error("Preencha o título da coleção!");
      return;
    }
    
    if (!session?.user) {
      toast.error("Você precisa estar logado!");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('collections')
        .insert({
          title: newCollectionTitle,
          publisher: newCollectionPublisher || "Desconhecido",
          user_id: session.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCollections([...collections, { ...data, issues: [] }]);
        setNewCollectionTitle("");
        setNewCollectionPublisher("");
        toast.success("Coleção adicionada!");
      }
    } catch (error) {
      console.error('Error adding collection:', error);
      toast.error("Erro ao adicionar coleção");
    }
  };

  const addIssue = async () => {
    if (!selectedCollectionId || !newIssueNumber) {
      toast.error("Selecione uma coleção e preencha o número da edição!");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('issues')
        .insert({
          collection_id: selectedCollectionId,
          issue_number: newIssueNumber,
          is_owned: false,
          cover_color: generateCoverColor(),
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCollections(collections.map(collection => {
          if (collection.id === selectedCollectionId) {
            return {
              ...collection,
              issues: sortIssuesAlphanumeric([...collection.issues, data]),
            };
          }
          return collection;
        }));

        setNewIssueNumber("");
        toast.success("Edição adicionada!");
      }
    } catch (error) {
      console.error('Error adding issue:', error);
      toast.error("Erro ao adicionar edição");
    }
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

  const searchMetron = async () => {
    if (!metronQuery.trim()) {
      toast.error("Digite um título para buscar!");
      return;
    }

    setIsMetronLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-metron', {
        body: { searchQuery: metronQuery }
      });

      if (error) throw error;

      if (data.success && data.data.length > 0) {
        setMetronResults(data.data);
        toast.success(`${data.data.length} resultados encontrados no Metron!`);
      } else {
        setMetronResults([]);
        toast.warning("Nenhum resultado encontrado");
      }
    } catch (error) {
      console.error('Erro ao buscar:', error);
      toast.error("Erro ao buscar no Metron");
      setMetronResults([]);
    } finally {
      setIsMetronLoading(false);
    }
  };

  const addCollectionFromMetron = async (result: MetronResult) => {
    if (!session?.user) {
      toast.error("Você precisa estar logado!");
      return;
    }

    setIsMetronLoading(true);
    toast.info("Buscando capas das edições...");
    
    try {
      // Create collection first
      const { data: collectionData, error: collectionError } = await supabase
        .from('collections')
        .insert({
          title: result.title,
          publisher: result.publisher,
          user_id: session.user.id,
          cover_url: result.coverUrl,
        })
        .select()
        .single();

      if (collectionError) throw collectionError;

      // Fetch issues with covers
      const { data, error } = await supabase.functions.invoke('search-metron', {
        body: { seriesId: result.seriesId }
      });

      if (error) throw error;

      let issuesData: Issue[] = [];
      
      if (data.success && data.data.length > 0) {
        // Insert issues into database
        const issuesToInsert = data.data.map((issue: any) => ({
          collection_id: collectionData.id,
          issue_number: issue.number,
          name: issue.name,
          is_owned: false,
          cover_color: generateCoverColor(),
          cover_url: issue.coverUrl,
        }));

        const { data: insertedIssues, error: issuesError } = await supabase
          .from('issues')
          .insert(issuesToInsert)
          .select();

        if (issuesError) throw issuesError;
        issuesData = sortIssuesAlphanumeric(insertedIssues || []);
      } else {
        // Fallback to numbered issues without covers
        const issuesToInsert = Array.from({ length: result.issueCount }, (_, i) => ({
          collection_id: collectionData.id,
          issue_number: `#${i + 1}`,
          is_owned: false,
          cover_color: generateCoverColor(),
        }));

        const { data: insertedIssues, error: issuesError } = await supabase
          .from('issues')
          .insert(issuesToInsert)
          .select();

        if (issuesError) throw issuesError;
        issuesData = sortIssuesAlphanumeric(insertedIssues || []);
      }

      const newCollection: Collection = {
        ...collectionData,
        issues: issuesData,
      };
      
      setCollections([...collections, newCollection].sort((a, b) => a.title.localeCompare(b.title)));
      toast.success(`${result.title} adicionado com ${issuesData.length} edições!`);
      setMetronResults([]);
      setMetronQuery("");
    } catch (error) {
      console.error('Erro ao adicionar coleção:', error);
      toast.error("Erro ao adicionar coleção");
    } finally {
      setIsMetronLoading(false);
    }
  };

  const addCollectionFromComicVine = async (result: ComicVineResult) => {
    if (!session?.user) {
      toast.error("Você precisa estar logado!");
      return;
    }

    setIsLoading(true);
    toast.info("Buscando capas das edições...");
    
    try {
      // Create collection first
      const { data: collectionData, error: collectionError } = await supabase
        .from('collections')
        .insert({
          title: result.title,
          publisher: result.publisher,
          user_id: session.user.id,
          cover_url: result.coverUrl,
        })
        .select()
        .single();

      if (collectionError) throw collectionError;

      // Fetch issues with covers
      const { data, error } = await supabase.functions.invoke('search-comic-vine', {
        body: { volumeApiUrl: result.apiUrl }
      });

      if (error) throw error;

      let issuesData: Issue[] = [];
      
      if (data.success && data.data.length > 0) {
        // Insert issues into database
        const issuesToInsert = data.data.map((issue: any) => ({
          collection_id: collectionData.id,
          issue_number: issue.number,
          name: issue.name,
          is_owned: false,
          cover_color: generateCoverColor(),
          cover_url: issue.coverUrl,
        }));

        const { data: insertedIssues, error: issuesError } = await supabase
          .from('issues')
          .insert(issuesToInsert)
          .select();

        if (issuesError) throw issuesError;
        issuesData = sortIssuesAlphanumeric(insertedIssues || []);
      } else {
        // Fallback to numbered issues without covers
        const issuesToInsert = Array.from({ length: result.issueCount }, (_, i) => ({
          collection_id: collectionData.id,
          issue_number: `#${i + 1}`,
          is_owned: false,
          cover_color: generateCoverColor(),
        }));

        const { data: insertedIssues, error: issuesError } = await supabase
          .from('issues')
          .insert(issuesToInsert)
          .select();

        if (issuesError) throw issuesError;
        issuesData = sortIssuesAlphanumeric(insertedIssues || []);
      }

      const newCollection: Collection = {
        ...collectionData,
        issues: issuesData,
      };
      
      setCollections([...collections, newCollection].sort((a, b) => a.title.localeCompare(b.title)));
      toast.success(`${result.title} adicionado com ${issuesData.length} edições!`);
      setSearchResults([]);
      setScrapingQuery("");
    } catch (error) {
      console.error('Erro ao adicionar coleção:', error);
      toast.error("Erro ao adicionar coleção");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCollection = async (collectionId: string) => {
    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId);

      if (error) throw error;

      setCollections(collections.filter(col => col.id !== collectionId));
      setCollectionToDelete(null);
      toast.success("Coleção removida!");
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error("Erro ao remover coleção");
    }
  };

  const toggleAllIssues = async (collectionId: string, ownedStatus: boolean) => {
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return;

    try {
      const { error } = await supabase
        .from('issues')
        .update({ is_owned: ownedStatus })
        .eq('collection_id', collectionId);

      if (error) throw error;

      setCollections(collections.map(collection => {
        if (collection.id === collectionId) {
          return {
            ...collection,
            issues: sortIssuesAlphanumeric(
              collection.issues.map(issue => ({ ...issue, is_owned: ownedStatus }))
            ),
          };
        }
        return collection;
      }));
      
      toast.success(ownedStatus ? "Todas marcadas como possuídas!" : "Todas desmarcadas!");
    } catch (error) {
      console.error('Error updating issues:', error);
      toast.error("Erro ao atualizar edições");
    }
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

  const updateConditionRating = async (collectionId: string, issueId: string, rating: number) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ condition_rating: rating })
        .eq('id', issueId);

      if (error) throw error;

      setCollections(collections.map(collection => {
        if (collection.id === collectionId) {
          return {
            ...collection,
            issues: sortIssuesAlphanumeric(
              collection.issues.map(issue =>
                issue.id === issueId ? { ...issue, condition_rating: rating } : issue
              )
            ),
          };
        }
        return collection;
      }));
      
      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue({ ...selectedIssue, condition_rating: rating });
      }
      
      toast.success("Avaliação de conservação atualizada!");
    } catch (error) {
      console.error('Error updating condition rating:', error);
      toast.error("Erro ao atualizar avaliação");
    }
  };

  const filteredCollections = collections.filter(collection =>
    collection.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.publisher.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalIssues = collections.reduce((acc, col) => acc + col.issues.length, 0);
  const ownedIssues = collections.reduce(
    (acc, col) => acc + col.issues.filter(i => i.is_owned).length,
    0
  );

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-slide-in">
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="inline-flex items-center justify-center p-3 bg-primary rounded-full shadow-comic">
              <Library className="h-8 w-8 text-primary-foreground" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
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
                      {result.coverUrl && (
                        <img
                          src={result.coverUrl}
                          alt={result.title}
                          className="w-16 h-24 object-cover rounded shadow-md"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground">{result.title}</h3>
                        <p className="text-sm text-muted-foreground">{result.publisher} ({result.year})</p>
                        <p className="text-xs text-muted-foreground">{result.issueCount} edições</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addCollectionFromComicVine(result)}
                        disabled={isLoading}
                        className="shadow-comic"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-comic border-2 bg-gradient-to-r from-secondary/10 to-primary/10">
            <CardHeader>
              <CardTitle className="text-xl font-black text-foreground flex items-center gap-2">
                <Download className="h-5 w-5" />
                Buscar no Metron
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Digite o título da coleção..."
                  value={metronQuery}
                  onChange={(e) => setMetronQuery(e.target.value)}
                  className="border-2 flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && searchMetron()}
                />
                <Button 
                  onClick={searchMetron}
                  disabled={isMetronLoading}
                  className="shadow-comic hover:shadow-comic-hover transition-all duration-300 hover:-translate-y-0.5"
                >
                  {isMetronLoading ? "Buscando..." : "Buscar"}
                </Button>
              </div>

              {metronResults.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <p className="text-sm font-bold text-muted-foreground">
                    {metronResults.length} resultados encontrados:
                  </p>
                  {metronResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex gap-3 p-3 border-2 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      {result.coverUrl && (
                        <img
                          src={result.coverUrl}
                          alt={result.title}
                          className="w-16 h-24 object-cover rounded shadow-md"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground">{result.title}</h3>
                        <p className="text-sm text-muted-foreground">{result.publisher} ({result.year})</p>
                        <p className="text-xs text-muted-foreground">{result.issueCount} edições</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addCollectionFromMetron(result)}
                        disabled={isMetronLoading}
                        className="shadow-comic"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-comic border-2">
            <CardHeader>
              <CardTitle className="text-xl font-black text-foreground flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Adicionar Coleção Manualmente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="Título da coleção"
                  value={newCollectionTitle}
                  onChange={(e) => setNewCollectionTitle(e.target.value)}
                  className="border-2"
                />
                <Input
                  placeholder="Editora (opcional)"
                  value={newCollectionPublisher}
                  onChange={(e) => setNewCollectionPublisher(e.target.value)}
                  className="border-2"
                />
              </div>
              <Button 
                onClick={addCollection}
                className="w-full shadow-comic hover:shadow-comic-hover transition-all duration-300 hover:-translate-y-0.5"
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar Coleção
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-comic border-2">
            <CardHeader>
              <CardTitle className="text-xl font-black text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Adicionar Edição
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="flex h-10 w-full rounded-md border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Selecione uma coleção</option>
                  {collections.map(collection => (
                    <option key={collection.id} value={collection.id}>
                      {collection.title}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Número da edição (ex: #1)"
                  value={newIssueNumber}
                  onChange={(e) => setNewIssueNumber(e.target.value)}
                  className="border-2"
                />
              </div>
              <Button 
                onClick={addIssue}
                className="w-full shadow-comic hover:shadow-comic-hover transition-all duration-300 hover:-translate-y-0.5"
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar Edição
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-comic border-2">
            <CardHeader>
              <CardTitle className="text-xl font-black text-foreground flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Coleção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Buscar por título ou editora..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-2"
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredCollections.length === 0 ? (
              <Card className="shadow-comic border-2">
                <CardContent className="text-center py-12">
                  <Library className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-xl font-bold text-muted-foreground">
                    Nenhuma coleção encontrada
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Adicione sua primeira coleção ou busque no Comic Vine!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-4">
                {filteredCollections.map((collection) => {
                  const ownedCount = collection.issues.filter(i => i.is_owned).length;
                  const totalCount = collection.issues.length;
                  const averageRating = collection.issues
                    .filter(i => i.is_owned && i.condition_rating)
                    .reduce((acc, i) => acc + (i.condition_rating || 0), 0) / 
                    (collection.issues.filter(i => i.is_owned && i.condition_rating).length || 1);
                  const hasRatings = collection.issues.some(i => i.is_owned && i.condition_rating);
                  
                  return (
                    <AccordionItem key={collection.id} value={collection.id} className="border-2 rounded-lg shadow-comic">
                      <AccordionTrigger className="px-6 hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            {collection.cover_url && (
                              <img
                                src={collection.cover_url}
                                alt={collection.title}
                                className="w-12 h-16 object-cover rounded shadow-md"
                              />
                            )}
                            <div className="text-left">
                              <h3 className="text-lg font-black text-foreground">{collection.title}</h3>
                              <p className="text-sm text-muted-foreground">{collection.publisher}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold text-primary">
                                  {ownedCount} de {totalCount} edições
                                </span>
                                {hasRatings && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                    <span className="text-xs font-bold text-yellow-600">
                                      {averageRating.toFixed(1)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAllIssues(collection.id, true);
                              }}
                              className="mr-2"
                            >
                              <CheckSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAllIssues(collection.id, false);
                              }}
                              className="mr-2"
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCollectionToDelete(collection.id);
                              }}
                              className="mr-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent 
                        className="px-6 pb-6 relative"
                        style={{
                          backgroundImage: collection.issues.find(i => i.is_owned)?.cover_url 
                            ? `linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95)), url(${collection.issues.find(i => i.is_owned)?.cover_url})`
                            : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        }}
                      >
                        {collection.issues.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            Nenhuma edição adicionada ainda
                          </p>
                        ) : (
                          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                            {collection.issues.map((issue) => (
                              <div
                                key={issue.id}
                                className="relative group cursor-pointer"
                                onClick={() => handleIssueClick(issue, collection)}
                              >
                                <div className={`aspect-[2/3] rounded-lg shadow-md overflow-hidden border-2 ${
                                  issue.is_owned ? 'border-primary' : 'border-muted'
                                } transition-all duration-300 group-hover:shadow-comic-hover group-hover:-translate-y-1`}>
                                  {issue.cover_url ? (
                                    <img
                                      src={issue.cover_url}
                                      alt={`Edição ${issue.issue_number}`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className={`w-full h-full ${issue.cover_color} flex items-center justify-center`}>
                                      <span className="text-white font-black text-lg">{issue.issue_number}</span>
                                    </div>
                                  )}
                                  <div className="absolute top-2 left-2 bg-background/90 rounded p-1" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                      checked={issue.is_owned}
                                      onCheckedChange={() => toggleIssueOwned(collection.id, issue.id)}
                                      className="h-5 w-5"
                                    />
                                  </div>
                                  {issue.condition_rating && issue.is_owned && (
                                    <div className="absolute bottom-2 left-2 bg-background/90 rounded px-2 py-1 flex items-center gap-1">
                                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                      <span className="text-xs font-bold">{issue.condition_rating}</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-center mt-1 font-bold text-foreground truncate">
                                  {issue.issue_number}
                                </p>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {selectedCollection?.title} - {selectedIssue?.issue_number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="relative">
              <Carousel className="w-full max-w-2xl mx-auto">
                <CarouselContent>
                  <CarouselItem>
                    {selectedIssue?.cover_url ? (
                      <img
                        src={selectedIssue.cover_url}
                        alt={`Edição ${selectedIssue.issue_number}`}
                        className="w-full h-auto rounded-lg shadow-comic"
                      />
                    ) : (
                      <div className={`w-full aspect-[2/3] ${selectedIssue?.cover_color} rounded-lg shadow-comic flex items-center justify-center`}>
                        <span className="text-white font-black text-6xl">{selectedIssue?.issue_number}</span>
                      </div>
                    )}
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious 
                  onClick={() => navigateIssue('prev')}
                  disabled={!selectedCollection || !selectedIssue || selectedCollection.issues.findIndex(i => i.id === selectedIssue.id) === 0}
                />
                <CarouselNext 
                  onClick={() => navigateIssue('next')}
                  disabled={!selectedCollection || !selectedIssue || selectedCollection.issues.findIndex(i => i.id === selectedIssue.id) === selectedCollection.issues.length - 1}
                />
              </Carousel>
              
              <div className="absolute top-4 left-4 flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => navigateIssue('prev')}
                  disabled={!selectedCollection || !selectedIssue || selectedCollection.issues.findIndex(i => i.id === selectedIssue.id) === 0}
                  className="bg-background/90"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => navigateIssue('next')}
                  disabled={!selectedCollection || !selectedIssue || selectedCollection.issues.findIndex(i => i.id === selectedIssue.id) === selectedCollection.issues.length - 1}
                  className="bg-background/90"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedIssue?.name && (
              <div>
                <h3 className="font-bold text-lg mb-2">Nome da Edição:</h3>
                <p className="text-muted-foreground">{selectedIssue.name}</p>
              </div>
            )}

            <div>
              <h3 className="font-bold text-lg mb-3">Status:</h3>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="owned-status"
                  checked={selectedIssue?.is_owned}
                  onCheckedChange={() => {
                    if (selectedCollection && selectedIssue) {
                      toggleIssueOwned(selectedCollection.id, selectedIssue.id);
                    }
                  }}
                  className="h-6 w-6"
                />
                <label
                  htmlFor="owned-status"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Eu possuo esta edição
                </label>
              </div>
            </div>

            {selectedIssue?.is_owned && (
              <div>
                <h3 className="font-bold text-lg mb-3">Avaliação de Conservação:</h3>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      variant={selectedIssue.condition_rating === rating ? "default" : "outline"}
                      size="lg"
                      onClick={() => {
                        if (selectedCollection && selectedIssue) {
                          updateConditionRating(selectedCollection.id, selectedIssue.id, rating);
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Star className={`h-5 w-5 ${
                        selectedIssue.condition_rating === rating 
                          ? "fill-current" 
                          : ""
                      }`} />
                      {rating}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  1 = Muito Ruim | 2 = Ruim | 3 = Regular | 4 = Boa | 5 = Excelente
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={collectionToDelete !== null} onOpenChange={(open) => !open && setCollectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta coleção? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => collectionToDelete && deleteCollection(collectionToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Colecao;
