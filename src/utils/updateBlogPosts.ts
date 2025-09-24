import { supabase } from '@/integrations/supabase/client';

export const updateBlogPostsNow = async () => {
  try {
    console.log('블로그 포스트 업데이트 시작...');
    
    const { data, error } = await supabase.functions.invoke('update-blog-posts', {
      body: { manual: true }
    });

    if (error) {
      console.error('블로그 포스트 업데이트 오류:', error);
      return { success: false, error };
    }

    console.log('블로그 포스트 업데이트 성공:', data);
    return { success: true, data };
  } catch (error) {
    console.error('블로그 포스트 업데이트 실패:', error);
    return { success: false, error };
  }
};

// 즉시 실행
updateBlogPostsNow().then(result => {
  if (result.success) {
    console.log('✅ 블로그 포스트가 성공적으로 업데이트되었습니다!');
    console.log('업데이트된 포스트 개수:', result.data?.posts?.length || 0);
    if (result.data?.posts) {
      console.log('최신 포스트 목록:');
      result.data.posts.forEach((post: any, index: number) => {
        console.log(`${index + 1}. ${post.title}`);
      });
    }
  } else {
    console.error('❌ 블로그 포스트 업데이트 실패:', result.error);
  }
});

console.log('🔄 블로그 포스트 업데이트를 다시 시도합니다...');