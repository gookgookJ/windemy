import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BlogPost {
  title: string;
  url: string;
}

async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    // 1) RSS/Atom 시도 (가장 정확)
    const rssCandidates = [
      'https://windly.cc/blog/rss.xml',
      'https://windly.cc/rss.xml',
      'https://windly.cc/feed',
      'https://windly.cc/feed.xml',
      'https://windly.cc/atom.xml'
    ];

    type RawPost = { title: string; url: string; date?: string };
    const rawPosts: RawPost[] = [];
    const seen = new Set<string>();

    async function tryParseRss(url: string) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; WindlyBot/1.0)',
            'Accept': 'application/rss+xml, application/xml;q=0.9, */*;q=0.8'
          }
        });
        if (!res.ok) return;
        const xml = await res.text();
        console.log('RSS fetched from:', url, 'len:', xml.length);

        // RSS 2.0: <item><link>..</link><title>..</title><pubDate>..</pubDate>
        const itemRegex = /<item[\s\S]*?<\/item>/g;
        const titleRegex = /<title>([\s\S]*?)<\/title>/i;
        const linkRegex = /<link>([\s\S]*?)<\/link>/i;
        const dateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/i;

        let matched = false;
        const items = xml.match(itemRegex) || [];
        for (const item of items) {
          const title = titleRegex.exec(item)?.[1]?.trim().replace(/\s+/g, ' ') || '';
          const link = linkRegex.exec(item)?.[1]?.trim() || '';
          const dateRaw = dateRegex.exec(item)?.[1]?.trim() || '';
          if (link.includes('/blog/') && title) {
            const urlNorm = link.startsWith('http') ? link : `https://windly.cc${link}`;
            if (!seen.has(urlNorm)) {
              seen.add(urlNorm);
              const dateStr = dateRaw ? new Date(dateRaw).toISOString().slice(0,10).replace(/-/g, '.') : undefined;
              rawPosts.push({ title, url: urlNorm, date: dateStr });
              matched = true;
            }
          }
        }

        // Atom: <entry><link href="..."/><title>..</title><updated>..</updated>
        if (!matched) {
          const entryRegex = /<entry[\s\S]*?<\/entry>/g;
          const entries = xml.match(entryRegex) || [];
          for (const entry of entries) {
            const title = /<title[\s\S]*?>([\s\S]*?)<\/title>/i.exec(entry)?.[1]?.trim().replace(/\s+/g, ' ') || '';
            const linkTag = /<link[^>]*href=["']([^"']+)["'][^>]*\/>/i.exec(entry)?.[1] || '';
            const updatedRaw = /<updated>([\s\S]*?)<\/updated>/i.exec(entry)?.[1] || '';
            if (linkTag.includes('/blog/') && title) {
              const urlNorm = linkTag.startsWith('http') ? linkTag : `https://windly.cc${linkTag}`;
              if (!seen.has(urlNorm)) {
                seen.add(urlNorm);
                const dateStr = updatedRaw ? updatedRaw.slice(0,10).replace(/-/g, '.') : undefined;
                rawPosts.push({ title, url: urlNorm, date: dateStr });
              }
            }
          }
        }
      } catch (e) {
        console.log('RSS parse failed for', url, e?.message);
      }
    }

    for (const rssUrl of rssCandidates) {
      if (rawPosts.length >= 5) break;
      await tryParseRss(rssUrl);
    }

    // 2) RSS에서 부족하면 sitemap 보조
    if (rawPosts.length < 5) {
      try {
        const siteRes = await fetch('https://windly.cc/sitemap.xml', {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WindlyBot/1.0)' }
        });
        if (siteRes.ok) {
          const sm = await siteRes.text();
          console.log('Sitemap fetched len:', sm.length);
          const locRegex = /<loc>([^<]+)<\/loc>/g;
          let m;
          const blogUrls: string[] = [];
          while ((m = locRegex.exec(sm)) !== null) {
            const loc = m[1];
            if (loc.includes('/blog/')) blogUrls.push(loc);
          }
          // 최신 것들이 보통 상단, 20개만 스캔
          for (const url of blogUrls.slice(0, 20)) {
            if (rawPosts.length >= 8) break; // 과도한 요청 방지
            if (seen.has(url)) continue;
            try {
              const pr = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WindlyBot/1.0)' } });
              if (!pr.ok) continue;
              const ph = await pr.text();
              const ogTitle = /property=["']og:title["'][^>]*content=["']([^"']+)["']/i.exec(ph)
                           || /<title>([^<]+)<\/title>/i.exec(ph);
              const title = ogTitle?.[1]?.trim() || '';
              if (title && !seen.has(url)) {
                seen.add(url);
                const ogDate = /property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i.exec(ph)?.[1];
                const dateStr = ogDate ? ogDate.slice(0,10).replace(/-/g, '.') : undefined;
                rawPosts.push({ title, url, date: dateStr });
              }
            } catch {}
          }
        }
      } catch (e) {
        console.log('Sitemap fetch failed', e?.message);
      }
    }

    // 3) 최후수단: /blog HTML에서 링크 스캔 (CSR일 경우 비어있을 수 있음)
    if (rawPosts.length < 5) {
      const response = await fetch('https://windly.cc/blog', {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WindlyBot/1.0)', 'Accept-Language': 'ko,en;q=0.9' }
      });
      const html = await response.text();
      console.log('Fetched /blog HTML length:', html.length);

      const allContent = html;
      const candidates: { url: string; index: number }[] = [];
      const aHref = /href=['\"](https?:\/\/windly\.cc\/blog\/[^'\"]+|\/blog\/[^'\"]+)['\"]/g;
      let linkMatch;
      while ((linkMatch = aHref.exec(allContent)) !== null) {
        let url = linkMatch[1];
        if (url.startsWith('/')) url = `https://windly.cc${url}`;
        if (seen.has(url)) continue;
        seen.add(url);
        candidates.push({ url, index: linkMatch.index });
      }
      console.log('Blog HTML candidates:', candidates.length);

      async function enrichFromContext(url: string, startIndex: number) {
        const searchArea = allContent.substring(startIndex, startIndex + 2000);
        let title = '';
        let dateStr = '';
        const altMatch = /alt=["']([^"']+)["']/.exec(searchArea);
        if (altMatch && altMatch[1].trim().length > 6) title = altMatch[1].trim();
        if (!title) {
          const h2Match = /<h2[^>]*>([^<]+)<\/h2>/i.exec(searchArea);
          if (h2Match) title = h2Match[1].trim();
        }
        const dateDot = /(\d{4}[.]\d{2}[.]\d{2})/.exec(searchArea);
        if (dateDot) dateStr = dateDot[1];
        if (!title) {
          try {
            const pr = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WindlyBot/1.0)' } });
            const ph = await pr.text();
            const ogTitle = /property=["']og:title["'][^>]*content=["']([^"']+)["']/i.exec(ph)
                         || /<title>([^<]+)<\/title>/i.exec(ph);
            if (ogTitle) title = ogTitle[1].trim();
          } catch {}
        }
        return { title, dateStr };
      }

      for (const { url, index } of candidates.slice(0, 15)) {
        const { title, dateStr } = await enrichFromContext(url, index);
        if (title && title.length > 5) {
          rawPosts.push({ title, url, date: dateStr });
        }
      }
    }

    console.log(`Total raw posts found: ${rawPosts.length}`);

    // 정렬 및 상위 5개 반환
    const postsWithDates = rawPosts.filter(p => p.date);
    const postsWithoutDates = rawPosts.filter(p => !p.date);
    const sorted = postsWithDates
      .map(p => ({ ...p, ts: Date.parse((p.date as string).replace(/\./g, '-')) }))
      .sort((a,b) => b.ts - a.ts)
      .slice(0,5)
      .map(p => ({ title: p.title, url: p.url }));

    if (sorted.length < 5) {
      const remaining = 5 - sorted.length;
      sorted.push(...postsWithoutDates.slice(0, remaining).map(p => ({ title: p.title, url: p.url })));
    }

    console.log(`Final sorted posts: ${sorted.length}`);
    sorted.forEach((p,i) => console.log(`${i+1}. ${p.title}`));
    return sorted;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

async function updateInfoBannerData(posts: BlogPost[]) {
  try {
    // InfoBanner 컴포넌트 파일 읽기
    const componentPath = '/src/components/InfoBanner.tsx';
    
    // 새로운 bestPosts 배열 생성
    const bestPostsCode = `  const bestPosts = [
${posts.map(post => `    {
      title: "${post.title.replace(/"/g, '\\"')}",
      url: "${post.url}"
    }`).join(',\n')}
  ];`;
    
    console.log('Updated bestPosts data:', bestPostsCode);
    
    // 실제 파일 업데이트는 클라이언트에서 처리하도록 데이터만 반환
    return { success: true, posts, bestPostsCode };
  } catch (error) {
    console.error('Error updating InfoBanner data:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // CORS 프리플라이트 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting blog posts update...');
    
    // 블로그 포스트 가져오기
    const posts = await fetchBlogPosts();
    
    if (posts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No blog posts found' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }
    
    // InfoBanner 데이터 업데이트
    const result = await updateInfoBannerData(posts);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully updated ${posts.length} blog posts`,
        posts: posts,
        bestPostsCode: result.bestPostsCode,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in update-blog-posts function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})