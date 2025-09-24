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

    // 더 단순한 접근: href와 그 이후 content를 순차적으로 파싱
    const allContent = html;
    
    // 모든 windly.cc/blog 링크를 찾기 (기본 /blog 제외)
    const linkRegex = /href="(https:\/\/windly\.cc\/blog\/[^"]+)"/g;
    let linkMatch;

    while ((linkMatch = linkRegex.exec(allContent)) !== null) {
      const url = linkMatch[1];
      if (seen.has(url)) continue;
      
      seen.add(url);

      // 링크 이후 1000자 내에서 제목과 날짜 찾기
      const startIndex = linkMatch.index;
      const searchArea = allContent.substring(startIndex, startIndex + 1000);
      
      // 제목 찾기 - 여러 패턴 시도
      let title = '';
      
      // 패턴 1: alt 속성 (가장 신뢰도 높음)
      const altMatch = /alt="([^"]+)"/.exec(searchArea);
      if (altMatch && altMatch[1].length > 10) {
        title = altMatch[1].trim();
      }
      
      // 패턴 2: title 클래스가 포함된 h2 태그
      if (!title) {
        const h2Match = /<h2[^>]*title[^>]*>([^<]+)<\/h2>/i.exec(searchArea);
        if (h2Match) {
          title = h2Match[1].trim();
        }
      }
      
      // 패턴 3: 일반적인 h2 태그 (MUI 스타일)
      if (!title) {
        const generalH2 = /<h2[^>]*MuiTypography[^>]*>([^<]+)<\/h2>/i.exec(searchArea);
        if (generalH2) {
          title = generalH2[1].trim();
        }
      }

      // 날짜 찾기
      let dateStr = '';
      const dateMatch = /(\d{4}\.\d{2}\.\d{2})/.exec(searchArea);
      if (dateMatch) {
        dateStr = dateMatch[1];
      }

      if (title && title.length > 5) {
        rawPosts.push({ title, url, date: dateStr });
        console.log(`Found post: "${title}" (${dateStr || 'no date'}) - ${url}`);
      }
    }

    console.log(`Total raw posts found: ${rawPosts.length}`);

    // 날짜가 있는 포스트들을 날짜 기준으로 정렬
    const postsWithDates = rawPosts.filter(p => p.date);
    const postsWithoutDates = rawPosts.filter(p => !p.date);
    
    console.log(`Posts with dates: ${postsWithDates.length}, without dates: ${postsWithoutDates.length}`);

    const sorted = postsWithDates
      .map(p => ({
        ...p,
        ts: Date.parse(p.date!.replace(/\./g, '-')),
      }))
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 5)
      .map(p => ({ title: p.title, url: p.url }));

    // 날짜가 있는 포스트가 5개 미만이면 날짜 없는 포스트도 추가
    if (sorted.length < 5) {
      const remaining = 5 - sorted.length;
      const additional = postsWithoutDates
        .slice(0, remaining)
        .map(p => ({ title: p.title, url: p.url }));
      sorted.push(...additional);
    }

    console.log(`Final sorted posts: ${sorted.length}`);
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