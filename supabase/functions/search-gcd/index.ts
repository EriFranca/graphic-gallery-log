import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GCD_API_BASE = 'https://www.comics.org/api';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchQuery, seriesUrl } = await req.json();

    // If seriesUrl is provided, fetch issues for that series
    if (seriesUrl) {
      console.log('Fetching issues for GCD series:', seriesUrl);
      
      // seriesUrl is like https://www.comics.org/api/series/12345/
      // We need to get the issue list from the series detail
      const seriesResponse = await fetch(`${seriesUrl}?format=json`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        }
      });

      if (!seriesResponse.ok) {
        throw new Error(`GCD API returned status ${seriesResponse.status}`);
      }

      const seriesData = await seriesResponse.json();
      console.log('GCD series data:', JSON.stringify(seriesData).substring(0, 500));

      // Get the series ID from URL
      const seriesIdMatch = seriesUrl.match(/\/series\/(\d+)\//);
      const seriesId = seriesIdMatch ? seriesIdMatch[1] : null;

      // Fetch issues for this series
      const issuesUrl = `${GCD_API_BASE}/issue/?series_name=${encodeURIComponent(seriesData.name)}&format=json&limit=200`;
      
      // Alternative: use the GCD website to get issue list
      const issueListUrl = `https://www.comics.org/series/${seriesId}/details/?format=json`;
      
      let issues: any[] = [];
      
      // Try fetching issue details
      try {
        const issuesResponse = await fetch(issueListUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          }
        });

        if (issuesResponse.ok) {
          const contentType = issuesResponse.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const issuesData = await issuesResponse.json();
            if (Array.isArray(issuesData)) {
              issues = issuesData;
            } else if (issuesData.results) {
              issues = issuesData.results;
            }
          }
        }
      } catch (err) {
        console.error('Error fetching issue details:', err);
      }

      // If we couldn't get individual issues, generate them from issue_count
      if (issues.length === 0 && seriesData.issue_count) {
        issues = Array.from({ length: seriesData.issue_count }, (_, i) => ({
          number: `${i + 1}`,
          name: '',
          coverUrl: null,
        }));
      } else {
        issues = issues.map((issue: any) => ({
          number: issue.number || issue.issue_number || 'N/A',
          name: issue.title || issue.name || '',
          coverUrl: null, // GCD doesn't provide covers via API easily
        }));
      }

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

    // Search for series
    console.log('Searching GCD for:', searchQuery);
    const url = `${GCD_API_BASE}/series/?name=${encodeURIComponent(searchQuery)}&format=json`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.error('GCD API error:', response.status);
      throw new Error(`GCD API returned status ${response.status}`);
    }

    const data = await response.json();
    console.log('GCD response count:', data.count);

    const results = (data.results || []).map((item: any) => ({
      title: item.name || 'Sem título',
      publisher: item.publisher_name || 'Desconhecido',
      year: item.year_began || 'N/A',
      issueCount: item.issue_count || 0,
      coverUrl: null, // GCD API doesn't return covers in search
      description: item.notes || '',
      link: `https://www.comics.org/series/${item.id}/`,
      apiUrl: item.url || `${GCD_API_BASE}/series/${item.id}/`,
    }));

    console.log('Processed GCD results:', results.length);

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
    console.error('Error in search-gcd:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: 'Erro ao buscar no Grand Comics Database'
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
