import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface EnrollmentSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function EnrollmentSearchFilter({ searchQuery, onSearchChange }: EnrollmentSearchFilterProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
      <Input
        placeholder="이름, 이메일로 검색..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
