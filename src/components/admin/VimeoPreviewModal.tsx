import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface VimeoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  sessionTitle: string;
}

export const VimeoPreviewModal = ({ isOpen, onClose, videoUrl, sessionTitle }: VimeoPreviewModalProps) => {
  // Extract Vimeo video ID from URL
  const getVimeoEmbedUrl = (url: string) => {
    const vimeoRegex = /(?:vimeo\.com\/(?:video\/)?(?:\d+\/)?(?:\d+\/)?(?:channels\/(?:\w+\/)?|(?:(?:groups\/[^/]*\/)?videos\/)?(?:.*\/)?))?(\d+)(?:\?|$|#)/;
    const match = url.match(vimeoRegex);
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}?autoplay=1&title=0&byline=0&portrait=0`;
    }
    return null;
  };

  const embedUrl = getVimeoEmbedUrl(videoUrl);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="text-lg">{sessionTitle} - 영상 미리보기</DialogTitle>
        </DialogHeader>
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={sessionTitle}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <p>유효하지 않은 Vimeo URL입니다.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};