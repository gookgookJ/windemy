import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageCircle } from "lucide-react";

interface InquiryModalProps {
  children: React.ReactNode;
}

export const InquiryModal = ({ children }: InquiryModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const channelUrl = "https://windemy.channel.io/home";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] w-[95vw] animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageCircle className="w-6 h-6 text-primary" />
            1:1 문의 (ChannelTalk)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg overflow-hidden border bg-background">
            <iframe
              src={channelUrl}
              title="ChannelTalk"
              className="w-full h-[70vh]"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            임베드가 차단될 경우 아래 버튼으로 새 창에서 열어주세요.
          </div>
          <div className="flex justify-end">
            <a href={channelUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="flex items-center gap-2">
                새 창에서 열기
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
