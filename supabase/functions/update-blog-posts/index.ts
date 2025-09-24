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

    // <a href="https://windly.cc/blog/[slug]"> 패턴으로 개별 포스트 링크 찾기
    const linkPattern = /<a href="(https:\/\/windly\.cc\/blog\/[^"]+)"[^>]*>/g;
    let linkMatch: RegExpExecArray | null;

    while ((linkMatch = linkPattern.exec(html)) !== null) {
      const url = linkMatch[1];
      if (seen.has(url)) continue;
      if (url === 'https://windly.cc/blog') continue;

      seen.add(url);

      // 해당 링크 태그 이후 콘텐츠에서 제목과 날짜 찾기
      const afterLinkIndex = linkMatch.index + linkMatch[0].length;
      const contentAfterLink = html.substring(afterLinkIndex, afterLinkIndex + 2000); // 2000자만 확인

      // 제목 추출: <h2 class="...title...">제목</h2>
      let title = '';
      const titleMatch = /<h2[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h2>/.exec(contentAfterLink);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }

      // alt 속성에서 제목 추출 (fallback)
      if (!title) {
        const beforeLinkIndex = Math.max(0, linkMatch.index - 500);
        const contentBeforeLink = html.substring(beforeLinkIndex, linkMatch.index + linkMatch[0].length + 500);
        const altMatch = /alt="([^"]+)"/.exec(contentBeforeLink);
        if (altMatch) {
          title = altMatch[1].trim();
        }
      }

      // 날짜 추출: <p class="...created-at...">YYYY.MM.DD</p>
      let dateStr = '';
      const dateMatch = /<p[^>]*class="[^"]*created-at[^"]*"[^>]*>(\d{4}\.\d{2}\.\d{2})<\/p>/.exec(contentAfterLink);
      if (dateMatch) {
        dateStr = dateMatch[1];
      }

      if (title && title.length > 5) {
        rawPosts.push({ title, url, date: dateStr });
        console.log(`Found post: ${title} (${dateStr}) - ${url}`);
      }
    }

    // 날짜 기준 내림차순 정렬 후 상위 5개 선택
    const sorted = rawPosts
      .filter(p => p.date) // 날짜가 있는 것만 필터링
      .map(p => ({
        ...p,
        ts: p.date ? Date.parse(p.date.replace(/\./g, '-')) : 0,
      }))
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 5)
      .map(p => ({ title: p.title, url: p.url }));

    console.log(`Collected ${sorted.length} posts (sorted by date desc)`);
    sorted.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title}`);
    });
    
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