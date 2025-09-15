import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, User, Calendar } from 'lucide-react';

interface FileDownload {
  id: string;
  user_id: string;
  session_id: string;
  file_name: string;
  downloaded_at: string;
  user: {
    full_name: string;
    email: string;
  };
  session: {
    title: string;
    course: {
      title: string;
    };
  };
}

export const FileDownloads = () => {
  const [downloads, setDownloads] = useState<FileDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    try {
      const { data, error } = await supabase
        .from('session_file_downloads')
        .select(`
          id,
          user_id,
          session_id,
          file_name,
          downloaded_at
        `)
        .order('downloaded_at', { ascending: false });

      if (error) throw error;

      // 사용자 정보와 세션 정보를 별도로 가져오기
      const userIds = [...new Set(data?.map(d => d.user_id))];
      const sessionIds = [...new Set(data?.map(d => d.session_id))];

      const [usersData, sessionsData] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds),
        supabase
          .from('course_sessions')
          .select(`
            id,
            title,
            course:courses(title)
          `)
          .in('id', sessionIds)
      ]);

      // 데이터 조합
      const enrichedDownloads = data?.map(download => ({
        ...download,
        user: usersData.data?.find(u => u.id === download.user_id) || { full_name: '알 수 없음', email: '' },
        session: sessionsData.data?.find(s => s.id === download.session_id) || { title: '알 수 없음', course: { title: '알 수 없음' } }
      })) || [];

      setDownloads(enrichedDownloads);
    } catch (error) {
      console.error('Error fetching downloads:', error);
      toast({
        title: "오류",
        description: "다운로드 데이터를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDownloads = downloads.filter(download => {
    const searchLower = searchTerm.toLowerCase();
    return (
      download.file_name.toLowerCase().includes(searchLower) ||
      download.user?.full_name?.toLowerCase().includes(searchLower) ||
      download.user?.email?.toLowerCase().includes(searchLower) ||
      download.session?.title?.toLowerCase().includes(searchLower) ||
      download.session?.course?.title?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-lg">로딩 중...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">파일 다운로드 로그</h1>
            <p className="text-muted-foreground">
              세션 자료 다운로드 현황을 확인하세요 ({filteredDownloads.length}개)
            </p>
          </div>
        </div>

        {/* 검색 */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="파일명, 사용자명, 강의명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* 다운로드 목록 */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-xl">다운로드 로그</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%]">파일명</TableHead>
                  <TableHead className="w-[20%]">사용자</TableHead>
                  <TableHead className="w-[25%]">강의/세션</TableHead>
                  <TableHead className="w-[15%]">다운로드 시간</TableHead>
                  <TableHead className="w-[15%]">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDownloads.map((download) => (
                  <TableRow key={download.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{download.file_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{download.user?.full_name}</div>
                          <div className="text-sm text-muted-foreground">{download.user?.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{download.session?.course?.title}</div>
                        <div className="text-sm text-muted-foreground">{download.session?.title}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          {new Date(download.downloaded_at).toLocaleString('ko-KR')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-green-600 font-medium">완료</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredDownloads.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-muted-foreground mb-4">
                  <Download className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">다운로드 로그가 없습니다</p>
                  <p className="text-sm">파일 다운로드가 발생하면 여기에 표시됩니다</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default FileDownloads;