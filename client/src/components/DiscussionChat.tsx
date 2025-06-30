import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { type Idea, type Discussion } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface DiscussionChatProps {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea | null;
}

export function DiscussionChat({ isOpen, onClose, idea }: DiscussionChatProps) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedSender, setSelectedSender] = useState<'nate' | 'janae'>('nate');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && idea) {
      loadDiscussions();
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
  }, [discussions]);

  const loadDiscussions = async () => {
    if (!idea) return;

    try {
      const response = await apiRequest('GET', `/api/discussions/${idea.id}`);
      const discussionData = await response.json();
      setDiscussions(discussionData);
    } catch (error) {
      console.error('Failed to load discussions:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!idea || !newMessage.trim()) return;

    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/discussions', {
        ideaId: idea.id,
        sender: selectedSender,
        content: newMessage,
      });

      setNewMessage('');
      await loadDiscussions();
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
    setDiscussions([]);
    setNewMessage('');
    setSelectedSender('nate');
    onClose();
  };

  if (!idea) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Nate & Janae Discussion</DialogTitle>
          <p className="text-sm text-gray-600">
            Collaborative chat about: "{idea.text.length > 50 ? idea.text.substring(0, 50) + '...' : idea.text}"
          </p>
        </DialogHeader>

        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 space-y-4">
          {discussions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No discussion yet. Start the conversation!</p>
            </div>
          ) : (
            discussions.map((discussion) => (
              <div key={discussion.id} className={`flex ${discussion.sender === 'nate' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-md">
                  <div className={`rounded-lg px-4 py-2 ${
                    discussion.sender === 'nate' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-purple-500 text-white'
                  }`}>
                    <p className="text-sm">{discussion.content}</p>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 px-2">
                    {discussion.sender === 'nate' ? 'Nate' : 'Janae'} • {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>

        <div className="p-4 border-t space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Send as:</span>
            <ToggleGroup type="single" value={selectedSender} onValueChange={(value) => value && setSelectedSender(value as 'nate' | 'janae')}>
              <ToggleGroupItem value="nate" className="data-[state=on]:bg-blue-500 data-[state=on]:text-white">
                Nate
              </ToggleGroupItem>
              <ToggleGroupItem value="janae" className="data-[state=on]:bg-purple-500 data-[state=on]:text-white">
                Janae
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          <div className="flex space-x-2">
            <Input
              placeholder={`Type as ${selectedSender}...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !newMessage.trim()}
              className={selectedSender === 'nate' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-500 hover:bg-purple-600'}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
