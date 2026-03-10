import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const METRON_USERNAME = Deno.env.get('METRON_USERNAME');
    const METRON_PASSWORD = Deno.env.get('METRON_PASSWORD');

    if (!METRON_USERNAME || !METRON_PASSWORD) {
      throw new Error('Metron credentials not configured');
    }

    const authHeader = 'Basic ' + btoa(`${METRON_USERNAME}:${METRON_PASSWORD}`);
    const { searchQuery, seriesId } = await req.json();

    // If seriesId is provided, fetch issues for that series
    if (seriesId) {
      console.log('Fetching issues for Metron series:', seriesId);
      
      let allIssues: any[] = [];
      let page = 1;
      let hasNext = true;

      while (hasNext) {
        const url = `https://metron.cloud/api/issue/?series_id=${seriesId}&page=${page}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json',
            'User-Agent': 'ComicCollector/1.0',
          }
        });

        if (!response.ok) {
          throw new Error(`Metron API returned status ${response.status}`);
        }

        const data = await response.json();
        allIssues = allIssues.concat(data.results || []);
        hasNext = !!data.next;
        page++;
      }

      const issues = allIssues.map((issue: any) => ({
        number: issue.number || 'N/A',
        name: issue.story_titles?.join(', ') || issue.name || '',
        coverUrl: issue.image || null,
        apiUrl: issue.id?.toString() || '',
      }));

      return new Response(
        JSON.stringify({ success: true, data: issues }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for series
    console.log('Searching Metron for:', searchQuery);
    const url = `https://metron.cloud/api/series/?name=${encodeURIComponent(searchQuery)}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'User-Agent': 'ComicCollector/1.0',
      }
    });

    if (!response.ok) {
      console.error('Metron API error:', response.status);
      throw new Error(`Metron API returned status ${response.status}`);
    }

    const data = await response.json();
    console.log('Metron results:', data.count);

    const results = (data.results || []).map((item: any) => ({
      title: item.name || item.display_name || 'Sem título',
      publisher: item.publisher?.name || 'Desconhecido',
      year: item.year_began?.toString() || 'N/A',
      issueCount: item.issue_count || 0,
      coverUrl: item.image || null,
      description: item.desc || '',
      link: `https://metron.cloud/series/${item.id}/`,
      apiUrl: item.id?.toString() || '',
    }));

    console.log('Processed Metron results:', results.length);

    return new Response(
      JSON.stringify({ success: true, data: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-metron:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, details: 'Erro ao buscar no Metron' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
