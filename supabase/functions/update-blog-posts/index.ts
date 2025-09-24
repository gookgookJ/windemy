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
    const response = await fetch('https://windly.cc/blog');
    const html = await response.text();

    console.log('Fetched HTML length:', html.length);

    type RawPost = { title: string; url: string; date?: string };
    const rawPosts: RawPost[] = [];
    const seen = new Set<string>();

    // 가장 단순한 방법: 모든 windly.cc/blog/* 링크를 찾고, 근처에서 제목과 날짜 찾기
    const blogLinkRegex = /href="(https:\/\/windly\.cc\/blog\/[^"]+)"/g;
    let match;

    console.log('Starting to search for blog links...');

    while ((match = blogLinkRegex.exec(html)) !== null) {
      const url = match[1];
      if (seen.has(url)) continue;
      
      seen.add(url);
      console.log(`Processing URL: ${url}`);

      // 링크 주변 2000자 범위에서 제목과 날짜 찾기
      const linkPosition = match.index;
      const startPos = Math.max(0, linkPosition - 1000);
      const endPos = Math.min(html.length, linkPosition + 2000);
      const surroundingContent = html.substring(startPos, endPos);
      
      console.log(`Searching content around position ${linkPosition}...`);

      // 제목 찾기 - 여러 방법 시도
      let title = '';
      
      // 방법 1: alt 속성에서 (가장 정확함)
      const altMatches = surroundingContent.matchAll(/alt="([^"]+)"/g);
      for (const altMatch of altMatches) {
        const altText = altMatch[1].trim();
        if (altText.length > 10 && !altText.includes('icon') && !altText.includes('mail')) {
          title = altText;
          console.log(`Found title via alt: ${title}`);
          break;
        }
      }

      // 방법 2: h2 태그에서
      if (!title) {
        const h2Matches = surroundingContent.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g);
        for (const h2Match of h2Matches) {
          const h2Text = h2Match[1].trim();
          if (h2Text.length > 10 && !h2Text.includes('지금 봐야할') && !h2Text.includes('추천 컨텐츠')) {
            title = h2Text;
            console.log(`Found title via h2: ${title}`);
            break;
          }
        }
      }

      // 날짜 찾기 (YYYY.MM.DD 형식)
      let dateStr = '';
      const dateMatch = surroundingContent.match(/(\d{4}\.\d{2}\.\d{2})/);
      if (dateMatch) {
        dateStr = dateMatch[1];
        console.log(`Found date: ${dateStr}`);
      }

      if (title && title.length > 5) {
        rawPosts.push({ title, url, date: dateStr });
        console.log(`Added post: "${title}" (${dateStr || 'no date'})`);
      } else {
        console.log(`Skipped URL (no valid title): ${url}`);
      }
    }

    console.log(`Total posts found: ${rawPosts.length}`);
    rawPosts.forEach((post, index) => {
      console.log(`${index + 1}. "${post.title}" (${post.date || 'no date'}) - ${post.url}`);
    });

    // 날짜별로 정렬
    const sorted = rawPosts
      .filter(p => p.date) // 날짜가 있는 것만
      .map(p => ({
        ...p,
        ts: Date.parse(p.date!.replace(/\./g, '-')),
      }))
      .sort((a, b) => b.ts - a.ts) // 최신순
      .slice(0, 5)
      .map(p => ({ title: p.title, url: p.url }));

    console.log(`Final result: ${sorted.length} posts`);
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