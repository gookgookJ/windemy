import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Eye, Edit, MoreHorizontal, Play, Pause, Trash2, Upload, ChevronLeft, ChevronRight, File } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface CourseSession {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  duration_minutes?: number;
  is_free: boolean;
  is_preview: boolean;
  course: {
    title: string;
    id: string;
  };
  section?: {
    title: string;
    id: string;
  };
}

interface SessionTableProps {
  sessions: CourseSession[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onEdit: (session: CourseSession) => void;
  onDelete: (sessionId: string, sessionTitle: string) => void;
}

export const SessionTable = ({
  sessions,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onEdit,
  onDelete
}: SessionTableProps) => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; title: string } | null>(null);

  const handleDeleteClick = (sessionId: string, sessionTitle: string) => {
    setSessionToDelete({ id: sessionId, title: sessionTitle });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (sessionToDelete) {
      onDelete(sessionToDelete.id, sessionToDelete.title);
    }
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return '미설정';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, sessions.length);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">세션명</TableHead>
              <TableHead className="w-[20%]">강의</TableHead>
              <TableHead className="w-[12%]">타입</TableHead>
              <TableHead className="w-[10%]">재생시간</TableHead>
              <TableHead className="w-[12%]">상태</TableHead>
              <TableHead className="w-[16%] text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-base max-w-[250px] truncate" title={session.title}>
                      {session.title}
                    </div>
                    {session.description && (
                      <div className="text-sm text-muted-foreground max-w-[250px] truncate">
                        {session.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {session.course?.title}
                  </div>
                  {session.section && (
                    <div className="text-xs text-muted-foreground">
                      섹션: {session.section.title}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {session.is_free && (
                      <Badge variant="secondary" className="text-xs">무료</Badge>
                    )}
                    {session.is_preview && (
                      <Badge variant="outline" className="text-xs">미리보기</Badge>
                    )}
                    {!session.is_free && !session.is_preview && (
                      <Badge variant="default" className="text-xs">프리미엄</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDuration(session.duration_minutes || 0)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {session.video_url ? (
                      <Badge variant="default" className="text-xs bg-green-500 w-fit">
                        <Play className="h-3 w-3 mr-1" />
                        영상 있음
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs w-fit">
                        <Pause className="h-3 w-3 mr-1" />
                        영상 없음
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {session.video_url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate(`/learn/${session.course?.id}?session=${session.id}`)}
                        className="h-8 px-3 hover-scale"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        재생
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover-scale">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem 
                          onClick={() => onEdit(session)}
                          className="cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          편집
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(session.id, session.title)}
                          className="text-destructive focus:text-destructive cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground mb-4">
              <Play className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">검색 결과가 없습니다</p>
              <p className="text-sm">다른 검색어를 입력하거나 필터를 조정해보세요</p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {startIndex + 1}-{endIndex}개 (총 {sessions.length}개)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </Button>
            
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent 
          className="z-[110] max-w-lg"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>세션 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 "{sessionToDelete?.title}" 세션을 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};