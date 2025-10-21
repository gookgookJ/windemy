import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Course {
  id: string;
  title: string;
  access_duration_days: number | null;
  total_students?: number;
}

interface CourseListTableProps {
  courses: Course[];
  selectedCourseId: string | null;
  onSelectCourse: (course: Course) => void;
}

export function CourseListTable({ courses, selectedCourseId, onSelectCourse }: CourseListTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          placeholder="강의명으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg">
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[60%]">강의명</TableHead>
                <TableHead className="w-[20%] text-center">수강생</TableHead>
                <TableHead className="w-[20%] text-center">학습 기간</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? '검색 결과가 없습니다.' : '강의가 없습니다.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCourses.map((course) => (
                  <TableRow
                    key={course.id}
                    className={`cursor-pointer transition-colors ${
                      selectedCourseId === course.id
                        ? 'bg-primary/10 hover:bg-primary/15'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => onSelectCourse(course)}
                  >
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">{course.total_students || 0}명</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={course.access_duration_days ? 'default' : 'secondary'}>
                        {course.access_duration_days 
                          ? `${course.access_duration_days}일` 
                          : '평생소장'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        총 {filteredCourses.length}개의 강의
      </p>
    </div>
  );
}
