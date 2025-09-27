import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, File, X, AlertTriangle } from 'lucide-react';

interface Material {
  id: string;
  title: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  order_index: number;
}

interface MaterialDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  materials: Material[];
  sectionTitle: string;
}

export const MaterialDeleteModal = ({ isOpen, onClose, onUpdate, materials, sectionTitle }: MaterialDeleteModalProps) => {
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMaterials(new Set(materials.map(m => m.id)));
    } else {
      setSelectedMaterials(new Set());
    }
  };

  const handleSelectMaterial = (materialId: string, checked: boolean) => {
    const newSelected = new Set(selectedMaterials);
    if (checked) {
      newSelected.add(materialId);
    } else {
      newSelected.delete(materialId);
    }
    setSelectedMaterials(newSelected);
  };

  const handleDelete = async () => {
    if (selectedMaterials.size === 0) {
      toast({
        title: "선택된 자료가 없습니다",
        description: "삭제할 자료를 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    const confirmed = window.confirm(
      `선택된 ${selectedMaterials.size}개의 자료를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      // Delete selected materials
      const { error } = await supabase
        .from('course_materials')
        .delete()
        .in('id', Array.from(selectedMaterials));

      if (error) throw error;

      toast({
        title: "삭제 완료",
        description: `${selectedMaterials.size}개의 자료가 삭제되었습니다.`
      });

      onUpdate();
      onClose();
      setSelectedMaterials(new Set());
    } catch (error) {
      console.error('Error deleting materials:', error);
      toast({
        title: "오류",
        description: "자료 삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setSelectedMaterials(new Set());
      onClose();
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  const allSelected = materials.length > 0 && selectedMaterials.size === materials.length;
  const someSelected = selectedMaterials.size > 0 && selectedMaterials.size < materials.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            자료 삭제 - {sectionTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {materials.length === 0 ? (
            <div className="text-center py-8">
              <File className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">삭제할 자료가 없습니다.</p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  disabled={isDeleting}
                  className={someSelected ? "data-[state=checked]:bg-primary data-[state=indeterminate]:bg-primary" : ""}
                />
                <span className="text-sm font-medium">
                  전체 선택 ({selectedMaterials.size}/{materials.length})
                </span>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">주의사항</p>
                  <p className="text-red-700 mt-1">
                    삭제된 자료는 복구할 수 없습니다. 신중하게 선택해주세요.
                  </p>
                </div>
              </div>

              {/* Materials List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {materials.map((material) => (
                  <div 
                    key={material.id} 
                    className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                      selectedMaterials.has(material.id) 
                        ? 'bg-red-50 border-red-200' 
                        : 'border-muted hover:bg-muted/30'
                    }`}
                  >
                    <Checkbox
                      checked={selectedMaterials.has(material.id)}
                      onCheckedChange={(checked) => handleSelectMaterial(material.id, checked as boolean)}
                      disabled={isDeleting}
                    />
                    
                    <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{material.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground truncate">
                          {material.file_name}
                        </p>
                        {material.file_size && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(material.file_size)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <Badge variant="outline" className="text-xs">
                      순서: {material.order_index}
                    </Badge>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
              취소
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete} 
              disabled={selectedMaterials.size === 0 || isDeleting}
              className="min-w-24"
            >
              {isDeleting ? '삭제 중...' : `${selectedMaterials.size}개 삭제`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};