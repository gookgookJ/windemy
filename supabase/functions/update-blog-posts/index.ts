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

    // 각 카드 a 태그 블록을 추출 (dotAll 대체: [\s\S])
    const cardPattern = /<a href="(https:\/\/windly\.cc\/blog\/[^"]+)">([\s\S]*?)<\/a>/g;
    let match: RegExpExecArray | null;

    while ((match = cardPattern.exec(html)) !== null) {
      const url = match[1];
      const block = match[2];
      if (seen.has(url)) continue;
      if (url === 'https://windly.cc/blog') continue;

      // 제목 추출: h2.title 우선, 없으면 img alt
      let title = '';
      const h2 = /<h2[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h2>/.exec(block);
      if (h2) title = h2[1].trim();
      if (!title) {
        const alt = /alt="([^"]+)"/.exec(block);
        if (alt) title = alt[1].trim();
      }

      // 날짜 추출: created-at 클래스 또는 YYYY.MM.DD 패턴
      let dateStr = '';
      const created = /<p[^>]*class="[^"]*created-at[^"]*"[^>]*>(\d{4}\.\d{2}\.\d{2})<\/p>/.exec(block);
      if (created) dateStr = created[1];
      if (!dateStr) {
        const anyDate = /(\d{4}\.\d{2}\.\d{2})/.exec(block);
        if (anyDate) dateStr = anyDate[1];
      }

      if (title && title.length > 5) {
        rawPosts.push({ title, url, date: dateStr });
        seen.add(url);
      }
    }

    // 날짜 기준 내림차순 정렬 후 상위 5개 선택
    const sorted = rawPosts
      .map(p => ({
        ...p,
        ts: p.date ? Date.parse(p.date.replace(/\./g, '-')) : 0,
      }))
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 5)
      .map(p => ({ title: p.title, url: p.url }));

    console.log(`Collected ${sorted.length} posts (sorted by date desc)`);
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