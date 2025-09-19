import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';

export const BlogUpdateTester = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleUpdateBlogPosts = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('update-blog-posts', {
        body: { manual: true }
      });

      if (error) {
        console.error('Error calling update-blog-posts:', error);
        toast({
          title: "오류",
          description: "블로그 포스트 업데이트 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        return;
      }

      setResult(data);
      toast({
        title: "성공",
        description: `${data.posts?.length || 0}개의 블로그 포스트를 업데이트했습니다.`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "오류",
        description: "요청 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          블로그 포스트 업데이트 테스터
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleUpdateBlogPosts}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isLoading ? '업데이트 중...' : '블로그 포스트 업데이트'}
        </Button>
        
        {result && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">업데이트 결과:</h3>
            <div className="space-y-2 text-sm">
              <p><strong>성공:</strong> {result.success ? '예' : '아니오'}</p>
              <p><strong>메시지:</strong> {result.message}</p>
              <p><strong>업데이트 시간:</strong> {new Date(result.timestamp).toLocaleString('ko-KR')}</p>
              
              {result.posts && (
                <div className="mt-4">
                  <p className="font-medium mb-2">가져온 포스트 ({result.posts.length}개):</p>
                  <div className="space-y-1">
                    {result.posts.map((post: any, index: number) => (
                      <div key={index} className="text-xs">
                        <a 
                          href={post.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {index + 1}. {post.title}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};