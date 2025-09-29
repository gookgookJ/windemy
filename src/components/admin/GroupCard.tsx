import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Edit, Trash2 } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  color: string;
  createdAt: string;
}

interface GroupCardProps {
  group: Group;
  selectedUsers: string[];
  onAssign: (groupId: string, groupName: string) => void;
  onEdit?: (groupId: string) => void;
  onDelete: (groupId: string, groupName: string) => void;
}

export const GroupCard = ({ group, selectedUsers, onAssign, onEdit, onDelete }: GroupCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-start gap-2">
            <div className={`w-3 h-3 rounded-full mt-1 ${group.color.split(' ')[0]}`}></div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{group.name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
            </div>
            <Badge className={`${group.color} text-xs shrink-0`} variant="secondary">
              {group.memberCount}
            </Badge>
          </div>
          
          {/* Footer info */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            생성: {group.createdAt}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-1 pt-3">
          {selectedUsers.length > 0 && (
            <Button 
              size="sm" 
              className="flex-1 h-8 text-xs"
              onClick={() => onAssign(group.id, group.name)}
            >
              <UserPlus className="h-3 w-3 mr-1" />
              배정
            </Button>
          )}
          
          {onEdit && (
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => onEdit(group.id)}>
              <Edit className="h-3 w-3" />
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(group.id, group.name)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};