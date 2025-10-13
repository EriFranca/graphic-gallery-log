import { Book } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-primary rounded-lg shadow-comic group-hover:shadow-comic-hover transition-all duration-300">
              <Book className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-black text-foreground">COMIC VAULT</span>
          </Link>
          
          <div className="flex gap-2">
            <Link to="/colecao">
              <button className={cn(
                "px-6 py-2 rounded-lg font-bold transition-all duration-300 shadow-comic hover:shadow-comic-hover hover:-translate-y-0.5",
                isActive("/colecao") 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
              )}>
                Coleção
              </button>
            </Link>
            <Link to="/curiosidades">
              <button className={cn(
                "px-6 py-2 rounded-lg font-bold transition-all duration-300 shadow-comic hover:shadow-comic-hover hover:-translate-y-0.5",
                isActive("/curiosidades") 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
              )}>
                Curiosidades
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
