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

    // Fazendo a busca no Guia dos Quadrinhos
    const searchUrl = `http://www.guiadosquadrinhos.com/search/title/${encodeURIComponent(searchQuery)}`;
    console.log('Fetching URL:', searchUrl);

    const response = await fetch(searchUrl);
    const html = await response.text();
    
    console.log('HTML received, parsing...');

    // Extraindo dados usando regex (parsing básico do HTML)
    const results = [];
    
    // Pattern para encontrar os resultados de busca
    // O site do Guia usa estruturas específicas que precisamos identificar
    const titlePattern = /<div class="title_search">.*?<a href="([^"]+)"[^>]*>([^<]+)<\/a>/gs;
    const coverPattern = /<img[^>]+src="([^"]+)"[^>]*class="[^"]*thumb/g;
    
    let titleMatch;
    let coverMatch;
    const titles = [];
    const covers = [];

    // Extrair títulos
    while ((titleMatch = titlePattern.exec(html)) !== null) {
      titles.push({
        link: titleMatch[1],
        title: titleMatch[2].trim()
      });
    }

    // Extrair capas
    while ((coverMatch = coverPattern.exec(html)) !== null) {
      covers.push(coverMatch[1]);
    }

    console.log('Found titles:', titles.length);
    console.log('Found covers:', covers.length);

    // Combinar títulos e capas
    for (let i = 0; i < Math.min(titles.length, covers.length); i++) {
      results.push({
        title: titles[i].title,
        link: `http://www.guiadosquadrinhos.com${titles[i].link}`,
        coverUrl: covers[i].startsWith('http') ? covers[i] : `http://www.guiadosquadrinhos.com${covers[i]}`
      });
    }

    console.log('Returning results:', results.length);

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