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
    const { searchQuery, seriesId } = await req.json();
    
    // If seriesId is provided, fetch issues for that series
    if (seriesId) {
      console.log('Fetching issues for series:', seriesId);
      const issuesUrl = `https://metron.cloud/api/issue/?series_id=${seriesId}`;
      
      const issuesResponse = await fetch(issuesUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!issuesResponse.ok) {
        throw new Error(`Metron API returned status ${issuesResponse.status}`);
      }

      const issuesData = await issuesResponse.json();
      
      const issues = issuesData.results.map((issue: any) => ({
        number: issue.number || 'N/A',
        name: issue.issue_name || '',
        coverUrl: issue.image ? `https://metron.cloud${issue.image}` : null,
        id: issue.id
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

    // Otherwise, search for series
    console.log('Searching Metron for:', searchQuery);
    const url = `https://metron.cloud/api/series/?name=${encodeURIComponent(searchQuery)}`;
    
    console.log('Calling Metron API');
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error('Metron API error:', response.status);
      throw new Error(`Metron API returned status ${response.status}`);
    }

    const data = await response.json();
    console.log('Metron response - results:', data.count);

    const results = data.results.map((item: any) => ({
      title: item.display_name || item.name,
      publisher: item.publisher?.name || 'Desconhecido',
      year: item.year_began || 'N/A',
      issueCount: item.issue_count || 0,
      coverUrl: item.image ? `https://metron.cloud${item.image}` : null,
      description: item.desc || '',
      link: `https://metron.cloud/series/${item.id}/`,
      seriesId: item.id
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
    console.error('Error in search-metron:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: 'Erro ao buscar no Metron'
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

