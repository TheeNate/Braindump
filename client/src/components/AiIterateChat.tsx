import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Idea, type AiIteration } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AiIterateChatProps {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea | null;
}

export function AiIterateChat({ isOpen, onClose, idea }: AiIterateChatProps) {
  const [messages, setMessages] = useState<AiIteration[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && idea) {
      loadMessages();
    }
  }, [isOpen, idea]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, [messages]);

  const loadMessages = async () => {
    if (!idea) return;

    try {
      const response = await apiRequest('GET', `/api/ai-iterations/${idea.id}`);
      const iterations = await response.json();
      setMessages(iterations);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!idea || !newMessage.trim()) return;

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/ai/iterate', {
        ideaId: idea.id,
        message: newMessage,
      });

      const aiResponse = await response.json();
      setNewMessage('');
      
      // Reload messages to get the full conversation
      await loadMessages();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    setMessages([]);
    setNewMessage('');
    onClose();
  };

  if (!idea) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>AI Iteration Chat</DialogTitle>
          <p className="text-sm text-gray-600">
            Focused brainstorming on: "{idea.text.length > 50 ? idea.text.substring(0, 50) + '...' : idea.text}"
          </p>
        </DialogHeader>

        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex justify-start">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 max-w-md">
                <p className="text-sm text-gray-800">
                  Let's develop this idea further. What specific aspects would you like to explore?
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg px-4 py-2 max-w-md ${
                  message.role === 'user' 
                    ? 'bg-gray-100' 
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <p className="text-sm text-gray-800">{message.content}</p>
                </div>
              </div>
            ))
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              placeholder="Continue developing this idea with AI..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !newMessage.trim()}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
