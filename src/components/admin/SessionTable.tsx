import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Eye, Upload, Play, Pause, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { VimeoPreviewModal } from './VimeoPreviewModal';

interface CourseSession {
  id: string;
  title: string;
  video_url?: string;
  is_free: boolean;
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; title: string } | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewSession, setPreviewSession] = useState<CourseSession | null>(null);

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

  const handlePreviewClick = (session: CourseSession) => {
    setPreviewSession(session);
    setPreviewModalOpen(true);
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
    <div className="space-y-2">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20">
              <TableHead className="w-[40%] py-1.5 text-xs font-medium text-muted-foreground">세션명</TableHead>
              <TableHead className="w-[20%] py-1.5 text-xs font-medium text-muted-foreground">상태</TableHead>
              <TableHead className="w-[40%] py-1.5 text-xs font-medium text-muted-foreground text-right">영상 업로드</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session, index) => (
              <TableRow 
                key={session.id} 
                className="border-b border-muted/30"
              >
                <TableCell className="py-1.5 px-3">
                  <div className="font-medium text-sm truncate" title={session.title}>
                    {session.title}
                  </div>
                </TableCell>
                <TableCell className="py-1.5 px-3">
                  {session.video_url ? (
                    <Badge variant="default" className="text-xs bg-green-500 text-white border-green-500 px-2 py-0.5 pointer-events-none">
                      <Play className="h-3 w-3 mr-1" />
                      영상 있음
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-gray-300 px-2 py-0.5 pointer-events-none">
                      <Pause className="h-3 w-3 mr-1" />
                      영상 없음
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="py-1.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onEdit(session)}
                      className="h-6 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      업로드
                    </Button>
                    {session.video_url && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteClick(session.id, session.title)}
                          className="h-6 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          삭제
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePreviewClick(session)}
                          className="h-6 px-2 text-xs text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          미리보기
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/10">
            <div className="text-muted-foreground">
              <Play className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">검색 결과가 없습니다</p>
              <p className="text-xs text-muted-foreground">다른 검색어를 입력하거나 필터를 조정해보세요</p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 bg-muted/10 border-t">
          <p className="text-xs text-muted-foreground">
            {startIndex + 1}-{endIndex}개 (총 {sessions.length}개)
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-6 w-6 p-0"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            
            <div className="flex items-center gap-0.5">
              {[...Array(Math.min(3, totalPages))].map((_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 2, currentPage - 1)) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="h-6 w-6 p-0 text-xs"
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
              className="h-6 w-6 p-0"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
        )}

      {/* Preview Modal */}
      <VimeoPreviewModal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewSession(null);
        }}
        videoUrl={previewSession?.video_url || ''}
        sessionTitle={previewSession?.title || ''}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent 
          className="z-[110] max-w-lg"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>영상 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 "{sessionToDelete?.title}" 세션의 영상을 삭제하시겠습니까?
              <br />
              세션은 유지되며 영상만 제거됩니다.
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