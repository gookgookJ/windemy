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

    const posts: BlogPost[] = [];
    const seen = new Set<string>();

    // 간단하고 직접적인 방법: <a href="https://windly.cc/blog/xxx"> 다음에 오는 alt 속성과 날짜 찾기
    const linkPattern = /<a href="(https:\/\/windly\.cc\/blog\/[^"]+)"/g;
    let match;

    while ((match = linkPattern.exec(html)) !== null) {
      const url = match[1];
      if (seen.has(url)) continue;
      seen.add(url);

      // 링크 이후 500자 내에서 alt 속성 찾기 (제목)
      const afterLink = html.substring(match.index, match.index + 500);
      const altMatch = /alt="([^"]+)"/.exec(afterLink);
      
      if (altMatch) {
        const title = altMatch[1].trim();
        
        // 날짜 찾기 (링크 이후 1000자 내에서)
        const extendedArea = html.substring(match.index, match.index + 1000);
        const dateMatch = /(\d{4}\.\d{2}\.\d{2})/.exec(extendedArea);
        
        if (title.length > 10 && !title.includes('icon') && !title.includes('mail')) {
          posts.push({
            title: title,
            url: url
          });
          console.log(`Found: ${title} - ${url} (${dateMatch ? dateMatch[1] : 'no date'})`);
        }
      }
    }

    console.log(`Total posts found: ${posts.length}`);
    
    // 최대 5개까지만 반환
    return posts.slice(0, 5);
    
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