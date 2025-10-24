import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

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
        console.log('RSS parse failed for', url, (e as any)?.message || e);
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
        console.log('Sitemap fetch failed', (e as any)?.message || e);
      }
    }

    // 3) 최후수단: /blog HTML에서 링크 스캔
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

async function saveBlogPostsToDB(posts: BlogPost[]) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log(`Attempting to save ${posts.length} posts to database...`);
    
    // 기존 데이터 조회
    const { data: currentPosts, error: selectError } = await supabase
      .from('best_blog_posts')
      .select('*')
      .order('order_index');
    
    if (selectError) {
      console.error('Error fetching current posts:', selectError);
    } else {
      console.log(`Current posts in DB: ${currentPosts?.length || 0}`);
      currentPosts?.forEach((p, i) => console.log(`  ${i+1}. ${p.title}`));
    }
    
    // 새로운 포스트와 기존 포스트 비교
    const currentPostsData = (currentPosts || []).map(p => ({ title: p.title, url: p.url }));
    const newPostsData = posts.map(p => ({ title: p.title, url: p.url }));
    
    const postsChanged = JSON.stringify(currentPostsData) !== JSON.stringify(newPostsData);
    
    console.log('Posts changed:', postsChanged);
    
    if (!postsChanged && currentPosts && currentPosts.length > 0) {
      console.log('No changes detected, keeping existing posts');
      
      // 로그 기록 (변경 없음)
      await supabase.from('blog_update_history').insert({
        posts_fetched: posts.length,
        posts_data: posts,
        success: true,
        error_message: 'No changes detected'
      });
      
      return { success: true, message: 'No changes', data: currentPosts };
    }
    
    console.log('Changes detected, updating database...');
    
    // 기존 데이터 삭제
    const { error: deleteError } = await supabase
      .from('best_blog_posts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 데이터 삭제
    
    if (deleteError) {
      console.error('Error deleting old posts:', deleteError);
      throw deleteError;
    }
    
    // 새 데이터 삽입
    const postsToInsert = posts.map((post, index) => ({
      title: post.title,
      url: post.url,
      order_index: index + 1
    }));
    
    console.log('Inserting new posts:', postsToInsert.length);
    
    const { data, error } = await supabase
      .from('best_blog_posts')
      .insert(postsToInsert)
      .select();
    
    if (error) {
      console.error('Error inserting blog posts:', error);
      throw error;
    }
    
    console.log(`Successfully saved ${posts.length} posts to database`);
    data?.forEach((p, i) => console.log(`  ${i+1}. ${p.title}`));
    
    // 로그 기록 (성공)
    const { error: logError } = await supabase
      .from('blog_update_history')
      .insert({
        posts_fetched: posts.length,
        posts_data: posts,
        success: true
      });
    
    if (logError) {
      console.error('Error logging blog update:', logError);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error saving blog posts to DB:', error);
    
    // 실패 로그도 기록
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase
        .from('blog_update_history')
        .insert({
          posts_fetched: posts.length,
          posts_data: posts,
          success: false,
          error_message: (error as any)?.message || 'Unknown error'
        });
    } catch (logErr) {
      console.error('Error logging failure:', logErr);
    }
    
    throw error;
  }
}

serve(async (req) => {
  // CORS 프리플라이트 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('========================================');
    console.log('Starting blog posts update at:', new Date().toISOString());
    console.log('========================================');
    
    // 블로그 포스트 가져오기
    const posts = await fetchBlogPosts();
    
    console.log('========================================');
    console.log('Fetch completed. Posts found:', posts.length);
    console.log('========================================');
    
    if (posts.length === 0) {
      console.log('WARNING: No blog posts found!');
      
      // 실패 로그 기록
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.from('blog_update_history').insert({
        posts_fetched: 0,
        posts_data: [],
        success: false,
        error_message: 'No blog posts found from any source'
      });
      
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
    
    // DB에 저장
    const result = await saveBlogPostsToDB(posts);
    
    console.log('========================================');
    console.log('Blog posts update completed successfully');
    console.log('========================================');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: result.message || `Successfully updated ${posts.length} blog posts`,
        posts: posts,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('========================================');
    console.error('FATAL ERROR in update-blog-posts function:', error);
    console.error('========================================');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as any)?.message || 'Unknown error',
        stack: (error as any)?.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})