import { Button } from "@/components/ui/button";
import { BookOpen, Library } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-comics.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-hero opacity-60" />
      
      <div className="container relative z-10 px-4 sm:px-6 py-12 sm:py-20 mx-auto text-center">
        <div className="animate-slide-in">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-4 sm:mb-6 text-primary-foreground drop-shadow-lg leading-tight">
            COMIC VAULT
          </h1>
          <p className="text-lg sm:text-2xl md:text-3xl mb-6 sm:mb-8 text-primary-foreground/90 font-bold max-w-2xl mx-auto px-2">
            Organize sua coleção de quadrinhos como um verdadeiro super-herói!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
            <Link to="/colecao" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-comic hover:shadow-comic-hover transition-all duration-300 hover:-translate-y-1 bg-primary hover:bg-primary/90"
              >
                <Library className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                Minha Coleção
              </Button>
            </Link>
            <Link to="/curiosidades" className="w-full sm:w-auto">
              <Button 
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-comic hover:shadow-comic-hover transition-all duration-300 hover:-translate-y-1"
              >
                <BookOpen className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                Curiosidades
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
