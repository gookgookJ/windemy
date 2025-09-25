import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const InquiryButton = () => {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  return (
    <>
      {/* Fixed floating button */}
      <Button
        onClick={() => setIsWidgetOpen(!isWidgetOpen)}
        className="fixed bottom-6 right-6 z-50 rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
        size="icon"
      >
        <MessageCircle className="w-6 h-6 text-primary-foreground" />
      </Button>

      {/* Chat widget popup */}
      {isWidgetOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 h-96 bg-white rounded-lg shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
          {/* Widget header */}
          <div className="flex items-center justify-between p-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-sm">윈들리아카데미</h3>
                <p className="text-xs opacity-90">24시간 운영해요</p>
              </div>
            </div>
            <Button
              onClick={() => setIsWidgetOpen(false)}
              variant="ghost"
              size="icon"
              className="w-6 h-6 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Chat iframe */}
          <div className="w-full h-full">
            <iframe
              src="https://windemy.channel.io/home"
              className="w-full h-full border-0"
              title="문의하기 채널톡"
              allow="camera; microphone; geolocation"
            />
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isWidgetOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsWidgetOpen(false)}
        />
      )}
    </>
  );
};

export default InquiryButton;