import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TrendingUp, Target, Zap, Brain, FileText } from 'lucide-react';
import { type Idea } from '@shared/schema';
import { CATEGORIES, type CategoryId } from '@/lib/constants';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface RecategorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea | null;
  onSuccess: () => void;
}

const iconMap = {
  TrendingUp,
  Target,
  Zap,
  Brain,
  FileText,
};

export function RecategorizationModal({ isOpen, onClose, idea, onSuccess }: RecategorizationModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('progress');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!idea) return;

    setIsSubmitting(true);
    try {
      await apiRequest('PUT', `/api/ideas/${idea.id}`, {
        category: selectedCategory,
        userFeedback: feedback,
      });

      toast({
        title: "Success",
        description: "Idea recategorized successfully",
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to recategorize idea",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCategory('progress');
    setFeedback('');
    onClose();
  };

  if (!idea) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Recategorize Idea</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            "{idea.text.length > 100 ? idea.text.substring(0, 100) + '...' : idea.text}"
          </p>

          <RadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
            {Object.entries(CATEGORIES).map(([key, category]) => {
              const Icon = iconMap[category.icon as keyof typeof iconMap];
              return (
                <div key={key} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value={key} id={key} />
                  <Label htmlFor={key} className="flex items-center space-x-3 cursor-pointer flex-1">
                    <div className={`w-6 h-6 ${category.iconBg} rounded-full flex items-center justify-center`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>

          <Textarea
            placeholder="Why did you choose this category? (Optional feedback for AI learning)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
          />

          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
