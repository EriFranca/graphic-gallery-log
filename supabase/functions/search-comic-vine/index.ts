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
    const { searchQuery, volumeApiUrl } = await req.json();
    
    const COMIC_VINE_API_KEY = Deno.env.get('COMIC_VINE_API_KEY');
    if (!COMIC_VINE_API_KEY) {
      throw new Error('COMIC_VINE_API_KEY not configured');
    }

    // If volumeApiUrl is provided, fetch issues for that volume
    if (volumeApiUrl) {
      console.log('Fetching issues for volume:', volumeApiUrl);
      const issuesUrl = `${volumeApiUrl}?api_key=${COMIC_VINE_API_KEY}&format=json&field_list=issues`;
      
      const volumeResponse = await fetch(issuesUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!volumeResponse.ok) {
        throw new Error(`Comic Vine API returned status ${volumeResponse.status}`);
      }

      const volumeData = await volumeResponse.json();
      
      if (volumeData.error !== 'OK') {
        throw new Error(`Comic Vine API error: ${volumeData.error}`);
      }

      const issues = volumeData.results.issues.map((issue: any) => ({
        number: issue.issue_number || 'N/A',
        name: issue.name || '',
        coverUrl: issue.image?.medium_url || issue.image?.small_url || null,
        apiUrl: issue.api_detail_url
      }));

      return new Response(
        JSON.stringify({ success: true, data: issues }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Otherwise, search for volumes
    console.log('Searching Comic Vine for:', searchQuery);
    const url = `https://comicvine.gamespot.com/api/search/?api_key=${COMIC_VINE_API_KEY}&query=${encodeURIComponent(searchQuery)}&format=json&resources=volume&limit=20`;
    
    console.log('Calling Comic Vine API');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error('Comic Vine API error:', response.status);
      throw new Error(`Comic Vine API returned status ${response.status}`);
    }

    const data = await response.json();
    console.log('Comic Vine response:', data.status_code, 'results:', data.number_of_total_results);

    if (data.error !== 'OK') {
      throw new Error(`Comic Vine API error: ${data.error}`);
    }

    const results = data.results.map((item: any) => ({
      title: item.name,
      publisher: item.publisher?.name || 'Desconhecido',
      year: item.start_year || 'N/A',
      issueCount: item.count_of_issues || 0,
      coverUrl: item.image?.medium_url || item.image?.small_url || null,
      description: item.deck || item.description || '',
      link: item.site_detail_url,
      apiUrl: item.api_detail_url
    }));

    console.log('Processed results:', results.length);

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
    console.error('Error in search-comic-vine:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: 'Erro ao buscar no Comic Vine'
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
