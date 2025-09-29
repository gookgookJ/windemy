import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Plus, Calendar as CalendarIcon, Trash2, Settings, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CoursePermissionModalProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
}

// Mock data
const mockCourses = [
  { id: '1', title: '웹 개발 기초', category: '프로그래밍', price: 65000, hasAccess: true },
  { id: '2', title: 'React 심화 과정', category: '프로그래밍', price: 89000, hasAccess: false },
  { id: '3', title: 'UI/UX 디자인', category: '디자인', price: 120000, hasAccess: false },
  { id: '4', title: '데이터 분석', category: '데이터', price: 95000, hasAccess: true },
];

const mockUserGroups = [
  { id: '1', name: 'VIP 회원', memberCount: 45, courses: ['1', '2', '3'] },
  { id: '2', name: '프리미엄 회원', memberCount: 120, courses: ['1', '2'] },
  { id: '3', name: '신규 회원', memberCount: 230, courses: ['1'] },
];

const mockActivePermissions = [
  {
    id: '1',
    courseTitle: '웹 개발 기초',
    startDate: '2024-01-15',
    endDate: '2024-12-31',
    status: 'active'
  },
  {
    id: '2', 
    courseTitle: '데이터 분석',
    startDate: '2024-02-01',
    endDate: '2024-06-30',
    status: 'active'
  }
];

export const CoursePermissionModal = ({ open, onClose, userId }: CoursePermissionModalProps) => {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  const filteredCourses = mockCourses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCourseSelect = (courseId: string, checked: boolean) => {
    if (checked) {
      setSelectedCourses([...selectedCourses, courseId]);
    } else {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            강의 권한 관리
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="permissions" className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="permissions">개별 권한 설정</TabsTrigger>
            <TabsTrigger value="groups">그룹 관리</TabsTrigger>
            <TabsTrigger value="history">권한 내역</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="permissions" className="space-y-6 mt-0">
              {/* 강의 검색 및 선택 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">강의 권한 부여</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="강의명 또는 카테고리로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="그룹으로 일괄 적용" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockUserGroups.map(group => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name} ({group.memberCount}명)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>강의명</TableHead>
                        <TableHead>카테고리</TableHead>
                        <TableHead>가격</TableHead>
                        <TableHead>현재 상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCourses.map(course => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedCourses.includes(course.id)}
                              onCheckedChange={(checked) => handleCourseSelect(course.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell>{course.category}</TableCell>
                          <TableCell>{course.price.toLocaleString()}원</TableCell>
                          <TableCell>
                            <Badge variant={course.hasAccess ? 'default' : 'secondary'}>
                              {course.hasAccess ? '권한 있음' : '권한 없음'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* 수강 기간 설정 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">수강 기간 설정</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">시작일</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, 'yyyy-MM-dd', { locale: ko }) : '시작일 선택'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">종료일</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, 'yyyy-MM-dd', { locale: ko }) : '종료일 선택'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={onClose}>
                      취소
                    </Button>
                    <Button disabled={selectedCourses.length === 0}>
                      권한 부여 ({selectedCourses.length}개 강의)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groups" className="space-y-6 mt-0">
              {/* 그룹 생성 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">고객 그룹 관리</CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    새 그룹 생성
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>그룹명</TableHead>
                        <TableHead>회원수</TableHead>
                        <TableHead>포함된 강의</TableHead>
                        <TableHead>관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockUserGroups.map(group => (
                        <TableRow key={group.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {group.name}
                            </div>
                          </TableCell>
                          <TableCell>{group.memberCount}명</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {group.courses.slice(0, 2).map(courseId => (
                                <Badge key={courseId} variant="outline" className="text-xs">
                                  {mockCourses.find(c => c.id === courseId)?.title}
                                </Badge>
                              ))}
                              {group.courses.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{group.courses.length - 2}개
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">편집</Button>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">현재 권한 내역</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>강의명</TableHead>
                        <TableHead>시작일</TableHead>
                        <TableHead>종료일</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockActivePermissions.map(permission => (
                        <TableRow key={permission.id}>
                          <TableCell className="font-medium">{permission.courseTitle}</TableCell>
                          <TableCell>{permission.startDate}</TableCell>
                          <TableCell>{permission.endDate}</TableCell>
                          <TableCell>
                            <Badge variant="default">활성</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">연장</Button>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};