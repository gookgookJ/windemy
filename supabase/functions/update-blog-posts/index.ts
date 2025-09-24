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
    
    // HTML에서 블로그 포스트 링크와 제목을 추출
    const posts: BlogPost[] = [];
    const seenUrls = new Set<string>();
    
    // href 속성에서 블로그 포스트 URL을 찾는 정규식
    const hrefPattern = /href="(https:\/\/windly\.cc\/blog\/[^"]+)"/g;
    let hrefMatch;
    
    while ((hrefMatch = hrefPattern.exec(html)) !== null && posts.length < 5) {
      const url = hrefMatch[1];
      
      if (seenUrls.has(url) || url === 'https://windly.cc/blog') continue;
      
      // 해당 링크 주변에서 제목 찾기
      const urlPosition = hrefMatch.index;
      const surroundingText = html.substring(urlPosition, urlPosition + 2000);
      
      // 제목을 찾는 여러 패턴 시도
      let title = '';
      
      // h2 태그 안의 제목 찾기
      const titleMatch1 = surroundingText.match(/<h2[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)</);
      if (titleMatch1) {
        title = titleMatch1[1].trim();
      } else {
        // alt 속성에서 제목 찾기
        const titleMatch2 = surroundingText.match(/alt="([^"]+)"/);
        if (titleMatch2) {
          title = titleMatch2[1].trim();
        }
      }
      
      if (title && title.length > 10 && !seenUrls.has(url)) {
        seenUrls.add(url);
        posts.push({ title, url });
        console.log(`Found post: "${title}" -> ${url}`);
      }
    }
    
    console.log(`Successfully fetched ${posts.length} blog posts`);
    return posts;
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