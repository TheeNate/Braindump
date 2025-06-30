import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, TrendingUp, Target, Zap, Brain, FileText } from 'lucide-react';
import { type Idea } from '@shared/schema';
import { CATEGORIES, type CategoryId } from '@/lib/constants';
import { IdeaCard } from './IdeaCard';

interface CategorySectionProps {
  category: CategoryId;
  ideas: Idea[];
  onRecategorize: (idea: Idea) => void;
  onAiIterate: (idea: Idea) => void;
  onDiscussion: (idea: Idea) => void;
  onDelete: (id: number) => void;
}

const iconMap = {
  TrendingUp,
  Target,
  Zap,
  Brain,
  FileText,
};

export function CategorySection({ 
  category, 
  ideas, 
  onRecategorize, 
  onAiIterate, 
  onDiscussion, 
  onDelete 
}: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(category === 'progress');
  const categoryConfig = CATEGORIES[category];
  const Icon = iconMap[categoryConfig.icon as keyof typeof iconMap];
  
  const lowConfidenceCount = ideas.filter(idea => parseFloat(idea.confidence) < 0.5).length;
  const needsReview = lowConfidenceCount > 0;

  return (
    <Card className={`shadow-lg overflow-hidden ${needsReview ? 'border-2 border-orange-300' : ''}`}>
      <div className={`${categoryConfig.bgColor} border-l-4 ${categoryConfig.borderColor.replace('border-', 'border-l-')} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 ${categoryConfig.iconBg} rounded-full flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{categoryConfig.name}</h3>
            <Badge className={`${categoryConfig.iconBg} text-white`}>
              {ideas.length} ideas
            </Badge>
            {needsReview && (
              <Badge className="bg-red-100 text-red-800">
                Manual Review Required
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className={`${categoryConfig.textColor} hover:${categoryConfig.textColor}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {isExpanded && ideas.length > 0 && (
        <CardContent className="p-6 space-y-4">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onRecategorize={onRecategorize}
              onAiIterate={onAiIterate}
              onDiscussion={onDiscussion}
              onDelete={onDelete}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
}
