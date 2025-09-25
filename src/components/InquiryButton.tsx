import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const InquiryButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInquiryClick = () => {
    window.open("https://windemy.channel.io/home", "_blank");
  };

  return (
    <>
      {/* Fixed floating button */}
      <Button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
        size="icon"
      >
        <MessageCircle className="w-6 h-6 text-primary-foreground" />
      </Button>

      {/* Inquiry modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">
              문의하기
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6 text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-primary/10 rounded-full">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">
                윈들리아카데미
              </h3>
              <p className="text-sm text-muted-foreground">
                궁금한 점이 있으시면 언제든지 문의해 주세요!
              </p>
            </div>

            <Button 
              onClick={handleInquiryClick}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              문의하기 →
            </Button>
            
            <p className="text-xs text-muted-foreground">
              • 빠른 답변을 위해 채널톡을 이용해주세요
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InquiryButton;