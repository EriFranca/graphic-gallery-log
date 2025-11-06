import { Book, Shield } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Navigation = () => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!roleData);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };
  
  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-md">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group min-w-0">
            <div className="p-1.5 sm:p-2 bg-primary rounded-lg shadow-comic group-hover:shadow-comic-hover transition-all duration-300 flex-shrink-0">
              <Book className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <span className="text-base sm:text-2xl font-black text-foreground truncate">
              <span className="hidden sm:inline">Cofre dos Quadrinhos</span>
              <span className="sm:hidden">Cofre HQ</span>
            </span>
          </Link>
          
          <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
            <Link to="/colecao">
              <button className={cn(
                "px-3 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg font-bold transition-all duration-300 shadow-comic hover:shadow-comic-hover hover:-translate-y-0.5",
                isActive("/colecao") 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
              )}>
                Coleção
              </button>
            </Link>
            <Link to="/curiosidades">
              <button className={cn(
                "px-3 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg font-bold transition-all duration-300 shadow-comic hover:shadow-comic-hover hover:-translate-y-0.5",
                isActive("/curiosidades") 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
              )}>
                Leilões
              </button>
            </Link>
            {isAdmin && (
              <Link to="/admin">
                <button className={cn(
                  "px-3 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg font-bold transition-all duration-300 shadow-comic hover:shadow-comic-hover hover:-translate-y-0.5 flex items-center gap-1",
                  isActive("/admin") 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                )}>
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
