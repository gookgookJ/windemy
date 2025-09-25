import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { File, ExternalLink, Download } from 'lucide-react';

interface Material {
  id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  file_url: string;
  order_index: number;
}

interface MaterialViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: Material[];
  sectionTitle: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const MaterialViewModal: React.FC<MaterialViewModalProps> = ({
  isOpen,
  onClose,
  materials,
  sectionTitle
}) => {
  const handleMaterialAction = (material: Material) => {
    if (material.file_type === 'link') {
      window.open(material.file_url, '_blank');
    } else {
      // 다운로드 로직
      const link = document.createElement('a');
      link.href = material.file_url;
      link.download = material.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            {sectionTitle} - 강의 자료
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {materials.length > 0 ? (
            <div className="space-y-3">
              {materials
                .sort((a, b) => a.order_index - b.order_index)
                .map((material, index) => (
                  <div
                    key={material.id}
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg text-xs font-medium text-primary">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {material.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{material.file_name}</span>
                        {material.file_size && (
                          <span>({formatFileSize(material.file_size)})</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={material.file_type === 'link' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {material.file_type === 'link' ? '링크' : '파일'}
                      </Badge>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMaterialAction(material)}
                        className="h-8 px-3"
                      >
                        {material.file_type === 'link' ? (
                          <ExternalLink className="h-3 w-3" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">업로드된 자료가 없습니다</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};