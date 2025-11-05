import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, Library, BookOpen, Download, Trash2, CheckSquare, Square, ChevronLeft, ChevronRight, Star, LogOut, Upload } from "lucide-react";
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
  const [newCollectionYear, setNewCollectionYear] = useState("");
  const [newCollectionCoverUrl, setNewCollectionCoverUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [newIssueNumber, setNewIssueNumber] = useState("");
  const [scrapingQuery, setScrapingQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ComicVineResult[]>([]);
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

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Por favor, selecione uma imagem!");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB!");
        return;
      }
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadCoverImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${session?.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('comic-covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('comic-covers')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Erro ao fazer upload da imagem");
      return null;
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
      let finalCoverUrl = newCollectionCoverUrl;

      // Upload cover file if selected
      if (coverFile) {
        const uploadedUrl = await uploadCoverImage(coverFile);
        if (uploadedUrl) {
          finalCoverUrl = uploadedUrl;
        }
      }

      const { data, error } = await supabase
        .from('collections')
        .insert({
          title: newCollectionTitle,
          publisher: newCollectionPublisher || "Desconhecido",
          start_year: newCollectionYear ? parseInt(newCollectionYear) : null,
          cover_url: finalCoverUrl || null,
          user_id: session.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCollections([...collections, { ...data, issues: [] }]);
        setNewCollectionTitle("");
        setNewCollectionPublisher("");
        setNewCollectionYear("");
        setNewCollectionCoverUrl("");
        setCoverFile(null);
        setCoverPreview("");
        toast.success("Coleção adicionada!");
      }
    } catch (error) {
      console.error('Error adding collection:', error);
      toast.error("Erro ao adicionar coleção");
    }
  };

  const populateFromComicVine = async () => {
    if (!newCollectionTitle.trim()) {
      toast.error("Digite um título primeiro!");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-comic-vine', {
        body: { searchQuery: newCollectionTitle }
      });

      if (error) throw error;

      if (data.success && data.data.length > 0) {
        const firstResult = data.data[0];
        setNewCollectionPublisher(firstResult.publisher);
        setNewCollectionYear(firstResult.year);
        setNewCollectionCoverUrl(firstResult.coverUrl);
        toast.success("Dados preenchidos do Comic Vine!");
      } else {
        toast.warning("Nenhum resultado encontrado no Comic Vine");
      }
    } catch (error) {
      console.error('Erro ao buscar:', error);
      toast.error("Erro ao buscar no Comic Vine");
    } finally {
      setIsLoading(false);
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
      
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <div className="text-center mb-8 sm:mb-12 animate-slide-in">
          <div className="flex justify-center items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="inline-flex items-center justify-center p-2 sm:p-3 bg-primary rounded-full shadow-comic">
              <Library className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-3 sm:mb-4 text-foreground">
            MINHA COLEÇÃO
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground px-4">
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
              <div className="flex flex-col sm:flex-row gap-3">
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
                  className="shadow-comic hover:shadow-comic-hover transition-all duration-300 hover:-translate-y-0.5 w-full sm:w-auto"
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
                      className="flex flex-col sm:flex-row gap-3 p-3 border-2 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex gap-3 flex-1">
                        {result.coverUrl && (
                          <img
                            src={result.coverUrl}
                            alt={result.title}
                            className="w-16 h-24 object-cover rounded shadow-md flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground truncate">{result.title}</h3>
                          <p className="text-sm text-muted-foreground">{result.publisher} ({result.year})</p>
                          <p className="text-xs text-muted-foreground">{result.issueCount} edições</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addCollectionFromComicVine(result)}
                        disabled={isLoading}
                        className="shadow-comic w-full sm:w-auto"
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
                Cadastrar Coleção Manualmente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <Input
                  placeholder="Título da coleção *"
                  value={newCollectionTitle}
                  onChange={(e) => setNewCollectionTitle(e.target.value)}
                  className="border-2"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Editora"
                    value={newCollectionPublisher}
                    onChange={(e) => setNewCollectionPublisher(e.target.value)}
                    className="border-2 flex-1"
                  />
                  <Button
                    onClick={populateFromComicVine}
                    disabled={isLoading}
                    variant="outline"
                    className="gap-2 w-full sm:w-auto"
                  >
                    <Search className="h-4 w-4" />
                    <span className="sm:inline">Buscar Comic Vine</span>
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    placeholder="Ano (ex: 1985)"
                    value={newCollectionYear}
                    onChange={(e) => setNewCollectionYear(e.target.value)}
                    className="border-2"
                    type="number"
                  />
                  <Input
                    placeholder="URL da capa"
                    value={newCollectionCoverUrl}
                    onChange={(e) => setNewCollectionCoverUrl(e.target.value)}
                    className="border-2"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-accent/20 hover:bg-accent/40 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                        <p className="mb-1 text-sm text-muted-foreground font-medium">
                          <span className="font-bold">Clique para enviar</span> ou arraste a capa
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP (máx. 5MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleCoverFileChange}
                      />
                    </label>
                  </div>
                  
                  {(coverPreview || newCollectionCoverUrl) && (
                    <div className="flex justify-center">
                      <div className="relative">
                        <img
                          src={coverPreview || newCollectionCoverUrl}
                          alt="Preview"
                          className="w-32 h-44 object-cover rounded shadow-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        {coverFile && (
                          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                            <Upload className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Button 
                onClick={addCollection}
                className="w-full shadow-comic hover:shadow-comic-hover transition-all duration-300 hover:-translate-y-0.5"
              >
                <Plus className="mr-2 h-4 w-4" /> Cadastrar Coleção
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
              <div className="grid gap-4 sm:grid-cols-2">
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
                      <AccordionTrigger className="px-3 sm:px-6 hover:no-underline">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full pr-2 sm:pr-4 gap-3">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            {collection.cover_url && (
                              <img
                                src={collection.cover_url}
                                alt={collection.title}
                                className="w-10 h-14 sm:w-12 sm:h-16 object-cover rounded shadow-md flex-shrink-0"
                              />
                            )}
                            <div className="text-left min-w-0 flex-1">
                              <h3 className="text-base sm:text-lg font-black text-foreground truncate">{collection.title}</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">{collection.publisher}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs font-bold text-primary whitespace-nowrap">
                                  {ownedCount}/{totalCount}
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
                          <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAllIssues(collection.id, true);
                              }}
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                              title="Marcar todas"
                            >
                              <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAllIssues(collection.id, false);
                              }}
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                              title="Desmarcar todas"
                            >
                              <Square className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCollectionToDelete(collection.id);
                              }}
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                              title="Excluir coleção"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent 
                        className="px-3 sm:px-6 pb-4 sm:pb-6 relative"
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
                          <p className="text-center text-muted-foreground py-8 text-sm">
                            Nenhuma edição adicionada ainda
                          </p>
                        ) : (
                          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-4">
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
                                      <span className="text-white font-black text-sm sm:text-lg">{issue.issue_number}</span>
                                    </div>
                                  )}
                                  <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-background/90 rounded p-0.5 sm:p-1" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                      checked={issue.is_owned}
                                      onCheckedChange={() => toggleIssueOwned(collection.id, issue.id)}
                                      className="h-4 w-4 sm:h-5 sm:w-5"
                                    />
                                  </div>
                                  {issue.condition_rating && issue.is_owned && (
                                    <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-background/90 rounded px-1.5 py-0.5 sm:px-2 sm:py-1 flex items-center gap-0.5 sm:gap-1">
                                      <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-yellow-500 text-yellow-500" />
                                      <span className="text-[10px] sm:text-xs font-bold">{issue.condition_rating}</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-[10px] sm:text-xs text-center mt-1 font-bold text-foreground truncate">
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-2xl font-black pr-8">
              {selectedCollection?.title} - {selectedIssue?.issue_number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6">
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
                        <span className="text-white font-black text-4xl sm:text-6xl">{selectedIssue?.issue_number}</span>
                      </div>
                    )}
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious 
                  onClick={() => navigateIssue('prev')}
                  disabled={!selectedCollection || !selectedIssue || selectedCollection.issues.findIndex(i => i.id === selectedIssue.id) === 0}
                  className="hidden sm:flex"
                />
                <CarouselNext 
                  onClick={() => navigateIssue('next')}
                  disabled={!selectedCollection || !selectedIssue || selectedCollection.issues.findIndex(i => i.id === selectedIssue.id) === selectedCollection.issues.length - 1}
                  className="hidden sm:flex"
                />
              </Carousel>
              
              <div className="flex sm:hidden justify-center gap-3 mt-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigateIssue('prev')}
                  disabled={!selectedCollection || !selectedIssue || selectedCollection.issues.findIndex(i => i.id === selectedIssue.id) === 0}
                  className="flex-1 max-w-[120px]"
                >
                  <ChevronLeft className="h-5 w-5 mr-1" />
                  Anterior
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigateIssue('next')}
                  disabled={!selectedCollection || !selectedIssue || selectedCollection.issues.findIndex(i => i.id === selectedIssue.id) === selectedCollection.issues.length - 1}
                  className="flex-1 max-w-[120px]"
                >
                  Próxima
                  <ChevronRight className="h-5 w-5 ml-1" />
                </Button>
              </div>
            </div>

            {selectedIssue?.name && (
              <div>
                <h3 className="font-bold text-base sm:text-lg mb-2">Nome da Edição:</h3>
                <p className="text-muted-foreground text-sm sm:text-base">{selectedIssue.name}</p>
              </div>
            )}

            <div>
              <h3 className="font-bold text-base sm:text-lg mb-3">Status:</h3>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="owned-status"
                  checked={selectedIssue?.is_owned}
                  onCheckedChange={() => {
                    if (selectedCollection && selectedIssue) {
                      toggleIssueOwned(selectedCollection.id, selectedIssue.id);
                    }
                  }}
                  className="h-6 w-6 sm:h-7 sm:w-7"
                />
                <label
                  htmlFor="owned-status"
                  className="text-sm sm:text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Eu possuo esta edição
                </label>
              </div>
            </div>

            {selectedIssue?.is_owned && (
              <div>
                <h3 className="font-bold text-base sm:text-lg mb-3">Avaliação de Conservação:</h3>
                <div className="flex flex-wrap gap-2">
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
                      className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[60px]"
                    >
                      <Star className={`h-4 w-4 sm:h-5 sm:w-5 ${
                        selectedIssue.condition_rating === rating 
                          ? "fill-current" 
                          : ""
                      }`} />
                      {rating}
                    </Button>
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
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
