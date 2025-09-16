import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

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
      <DialogContent aria-describedby={undefined} className="sm:max-w-[420px] w-[92vw] p-0 overflow-hidden rounded-xl">
        <div className="flex items-center justify-center p-0 bg-background">
          <iframe
            src={channelUrl}
            title="ChannelTalk"
            className="w-[380px] h-[560px]"
            referrerPolicy="no-referrer"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
