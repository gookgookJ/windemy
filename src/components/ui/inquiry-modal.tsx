import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

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
      <DialogContent aria-describedby={undefined} className="sm:max-w-[420px] w-[92vw] p-4 animate-scale-in">
        <div className="space-y-3 text-center">
          <Button asChild className="w-full h-12 text-base">
            <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5" /> 채널톡으로 바로 문의하기
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">새 창으로 열립니다. 문의가 어려우면 support@windly.cc 로 메일 주세요.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
