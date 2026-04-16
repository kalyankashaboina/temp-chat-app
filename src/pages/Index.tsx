import { ChatLayout } from '@/features/chat/components/ChatLayout';
import { Toaster } from '@/components/ui/sonner';

const Index = () => {
  return (
    <>
      <ChatLayout />
      <Toaster position="top-center" />
    </>
  );
};

export default Index;
