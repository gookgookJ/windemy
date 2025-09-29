import { useState } from 'react';
import { Gift, Coins, Download, Users2, FileText, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface UserBulkActionSidebarProps {
  selectedUsers: string[];
  onDeselectAll: () => void;
  onCouponDistribute: (userIds: string[]) => void;
  onPointsDistribute: (userIds: string[]) => void;
  onBulkAction: (action: string, userIds: string[]) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const UserBulkActionSidebar = ({
  selectedUsers,
  onDeselectAll,
  onCouponDistribute,
  onPointsDistribute,
  onBulkAction,
  isCollapsed = false,
  onToggleCollapse
}: UserBulkActionSidebarProps) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const hasSelectedUsers = selectedUsers.length > 0;

  const actionItems = [
    {
      id: 'rewards',
      label: '혜택 지급',
      icon: Gift,
      actions: [
        {
          label: '쿠폰 지급',
          icon: Gift,
          onClick: () => onCouponDistribute(selectedUsers),
          description: '선택된 회원에게 쿠폰을 지급합니다'
        },
        {
          label: '적립금 지급',
          icon: Coins,
          onClick: () => onPointsDistribute(selectedUsers),
          description: '선택된 회원에게 적립금을 지급합니다'
        }
      ]
    },
    {
      id: 'management',
      label: '회원 관리',
      icon: Users2,
      actions: [
        {
          label: '그룹 관리',
          icon: Users2,
          onClick: () => onBulkAction('group_management', selectedUsers),
          description: '선택된 회원의 그룹을 설정합니다'
        }
      ]
    },
    {
      id: 'export',
      label: '데이터 내보내기',
      icon: Download,
      actions: [
        {
          label: 'Excel 내보내기',
          icon: Download,
          onClick: () => onBulkAction('export', selectedUsers),
          description: '선택된 회원 정보를 Excel 파일로 내보냅니다'
        }
      ]
    }
  ];

  if (isCollapsed) {
    return (
      <div className="w-16 border-r border-border/30 bg-muted/20 flex flex-col items-center py-4 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-10 h-10 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        {hasSelectedUsers && (
          <Badge variant="default" className="w-10 h-6 p-0 flex items-center justify-center text-xs">
            {selectedUsers.length}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-border/30 bg-muted/20 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">회원 관리</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="w-8 h-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Selection Status */}
        <Card className={cn(
          "transition-all duration-200",
          hasSelectedUsers ? "border-primary/20 bg-primary/5" : "border-border/50"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>선택된 회원</span>
              {hasSelectedUsers && (
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  {selectedUsers.length}명
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {hasSelectedUsers ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {selectedUsers.length}명의 회원이 선택되었습니다.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDeselectAll}
                  className="w-full h-9"
                >
                  선택 해제
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                회원을 선택하면 관리 작업을 수행할 수 있습니다.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {hasSelectedUsers && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">가능한 작업</h4>
            
            {actionItems.map((section) => (
              <Card key={section.id} className="overflow-hidden">
                <CardHeader 
                  className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedSection(
                    expandedSection === section.id ? null : section.id
                  )}
                >
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <section.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{section.label}</span>
                    </div>
                    <ChevronRight 
                      className={cn(
                        "h-4 w-4 transition-transform text-muted-foreground",
                        expandedSection === section.id && "rotate-90"
                      )}
                    />
                  </CardTitle>
                </CardHeader>
                
                {expandedSection === section.id && (
                  <CardContent className="pt-0 pb-3">
                    <div className="space-y-2">
                      {section.actions.map((action, index) => (
                        <div key={index}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-auto p-3 text-left"
                            onClick={action.onClick}
                          >
                            <div className="flex items-start gap-3">
                              <action.icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                              <div className="space-y-1">
                                <div className="text-sm font-medium">{action.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {action.description}
                                </div>
                              </div>
                            </div>
                          </Button>
                          {index < section.actions.length - 1 && (
                            <Separator className="mx-3" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Quick Tips */}
        {!hasSelectedUsers && (
          <Card className="border-dashed border-muted-foreground/30">
            <CardContent className="pt-4">
              <div className="text-center space-y-2">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium text-foreground">빠른 시작</p>
                <p className="text-xs text-muted-foreground">
                  회원 목록에서 체크박스를 선택하여<br />
                  여러 회원을 한번에 관리하세요.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};