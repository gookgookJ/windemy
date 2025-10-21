import { format, parseISO } from 'date-fns';
import { Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface Enrollment {
  id: string;
  user_id: string;
  enrolled_at: string;
  expires_at: string | null;
  progress: number;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface EnrollmentTableProps {
  enrollments: Enrollment[];
  selectedEnrollments: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectEnrollment: (enrollmentId: string, checked: boolean) => void;
  onEditExpiry: (enrollment: Enrollment) => void;
  onDeleteEnrollment: (enrollment: Enrollment) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function EnrollmentTable({
  enrollments,
  selectedEnrollments,
  onSelectAll,
  onSelectEnrollment,
  onEditExpiry,
  onDeleteEnrollment,
  currentPage,
  totalPages,
  onPageChange
}: EnrollmentTableProps) {
  const isAllSelected = enrollments.length > 0 && selectedEnrollments.length === enrollments.length;
  const isSomeSelected = selectedEnrollments.length > 0 && selectedEnrollments.length < enrollments.length;

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border rounded-lg">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                aria-label="전체 선택"
                className={isSomeSelected ? "data-[state=checked]:bg-primary/50" : ""}
              />
            </TableHead>
            <TableHead className="w-[120px]">학생명</TableHead>
            <TableHead className="w-[200px]">이메일</TableHead>
            <TableHead className="w-[120px]">등록일</TableHead>
            <TableHead className="w-[140px]">만료일</TableHead>
            <TableHead className="w-[100px]">진도율</TableHead>
            <TableHead className="w-[100px]">상태</TableHead>
            <TableHead className="text-right w-[200px]">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map((enrollment) => {
            const expired = isExpired(enrollment.expires_at);
            const enrolledDate = format(parseISO(enrollment.enrolled_at), 'yyyy-MM-dd');
            const isSelected = selectedEnrollments.includes(enrollment.id);
            
            return (
              <TableRow key={enrollment.id} className={isSelected ? 'bg-muted/50' : ''}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelectEnrollment(enrollment.id, checked as boolean)}
                    aria-label={`${enrollment.profiles.full_name} 선택`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {enrollment.profiles.full_name}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {enrollment.profiles.email}
                </TableCell>
                <TableCell className="text-sm">
                  {enrolledDate}
                </TableCell>
                <TableCell>
                  {enrollment.expires_at ? (
                    <span className={`text-sm ${expired ? 'text-destructive font-medium' : ''}`}>
                      {format(parseISO(enrollment.expires_at), 'yyyy-MM-dd HH:mm')}
                    </span>
                  ) : (
                    <Badge variant="secondary" className="font-normal">
                      평생소장
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    {Math.round(enrollment.progress)}%
                  </span>
                </TableCell>
                <TableCell>
                  {expired ? (
                    <Badge variant="destructive">만료</Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-500">수강중</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditExpiry(enrollment)}
                      className="gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>만료일</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDeleteEnrollment(enrollment)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              const showPage = 
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1);
              
              if (!showPage) {
                // Show ellipsis
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <PaginationItem key={page}>
                      <span className="px-2">...</span>
                    </PaginationItem>
                  );
                }
                return null;
              }

              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => onPageChange(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
