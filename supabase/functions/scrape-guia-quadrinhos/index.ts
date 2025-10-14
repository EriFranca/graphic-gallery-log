import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchQuery } = await req.json();
    console.log('Searching for:', searchQuery);

    // Tentando diferentes URLs de busca
    const searchUrls = [
      `http://www.guiadosquadrinhos.com/titulos?q=${encodeURIComponent(searchQuery)}`,
      `http://www.guiadosquadrinhos.com/busca?query=${encodeURIComponent(searchQuery)}`,
      `http://www.guiadosquadrinhos.com/pesquisar?titulo=${encodeURIComponent(searchQuery)}`
    ];

    const results = [];
    
    for (const searchUrl of searchUrls) {
      try {
        console.log('Trying URL:', searchUrl);
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (!response.ok) {
          console.log(`URL ${searchUrl} returned status ${response.status}`);
          continue;
        }
        
        const html = await response.text();
        console.log('HTML received, length:', html.length);
        
        // Padrão para extrair títulos da tabela
        const titlePattern = /<td>\s*<a href="([^"]+)"[^>]*>([^<]+)<\/a><\/td>/gi;
        const titles = [];
        
        let titleMatch;
        while ((titleMatch = titlePattern.exec(html)) !== null) {
          titles.push({
            link: titleMatch[1],
            title: titleMatch[2].trim()
          });
        }

        console.log('Found titles:', titles.length);

        if (titles.length > 0) {
          // Limitar a 20 resultados
          for (let i = 0; i < Math.min(titles.length, 20); i++) {
            results.push({
              title: titles[i].title,
              link: titles[i].link.startsWith('http') ? titles[i].link : `http://www.guiadosquadrinhos.com${titles[i].link}`,
              coverUrl: null // O site não mostra capas na lista de títulos
            });
          }
        }

        if (results.length > 0) {
          break;
        }
      } catch (urlError) {
        console.log('Error with URL:', searchUrl, urlError);
        continue;
      }
    }

    console.log('Total results found:', results.length);

    return new Response(
      JSON.stringify({ success: true, data: results }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in scrape-guia-quadrinhos:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: 'Erro ao fazer scraping do Guia dos Quadrinhos'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});