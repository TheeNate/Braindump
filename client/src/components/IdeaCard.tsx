import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Recycle, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Bot,
  Users,
  ArrowRight
} from 'lucide-react';
import { type Idea } from '@shared/schema';
import { getConfidenceBadgeClass, getConfidenceBorderClass } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';

interface IdeaCardProps {
  idea: Idea;
  onRecategorize: (idea: Idea) => void;
  onAiIterate: (idea: Idea) => void;
  onDiscussion: (idea: Idea) => void;
  onDelete: (id: number) => void;
}

export function IdeaCard({ 
  idea, 
  onRecategorize, 
  onAiIterate, 
  onDiscussion, 
  onDelete 
}: IdeaCardProps) {
  const [expandLevel, setExpandLevel] = useState<0 | 1 | 2>(0);
  
  const confidence = parseFloat(idea.confidence);
  const isLowConfidence = confidence < 0.5;
  const truncatedText = idea.text.length > 80 ? idea.text.substring(0, 80) + '...' : idea.text;
  const showExpandButton = idea.text.length > 80;

  const toggleExpansion = () => {
    if (expandLevel === 0) {
      setExpandLevel(1);
    } else if (expandLevel === 1 && showExpandButton) {
      setExpandLevel(2);
    } else {
      setExpandLevel(0);
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${isLowConfidence ? 'border-orange-300 bg-orange-50' : ''}`}>
      <CardContent className="p-4">
        <div className={`${getConfidenceBorderClass(confidence)} pl-4`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="text-gray-800 text-sm">
                {expandLevel === 2 ? idea.text : truncatedText}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={getConfidenceBadgeClass(confidence)}>
                  {Math.round(confidence * 100)}% confidence
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true })}
                </span>
                {isLowConfidence && (
                  <Badge className="bg-orange-100 text-orange-800">
                    Needs Review
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              {isLowConfidence && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="p-1 bg-orange-500 text-white hover:bg-orange-600"
                  onClick={() => onRecategorize(idea)}
                  title="Recategorize"
                >
                  <Recycle className="w-4 h-4" />
                </Button>
              )}
              
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-1 text-gray-400 hover:text-blue-500"
                onClick={() => onAiIterate(idea)}
                title="AI Iterate"
              >
                <Bot className="w-4 h-4" />
              </Button>
              
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-1 text-gray-400 hover:text-purple-500"
                onClick={() => onDiscussion(idea)}
                title="Discussion"
              >
                <Users className="w-4 h-4" />
              </Button>
              
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-1 text-gray-400 hover:text-red-500"
                onClick={() => onDelete(idea.id)}
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-1 text-gray-400 hover:text-green-500"
                onClick={toggleExpansion}
                title={expandLevel === 0 ? "Expand" : "Collapse"}
              >
                {expandLevel === 0 ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded Level 1: AI Analysis */}
        {expandLevel >= 1 && (
          <div className="bg-gray-50 p-4 border-t mt-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">AI Analysis</h4>
                <p className="text-sm text-gray-600 mb-3">
                  {idea.reasoning || 'No reasoning provided'}
                </p>
                
                {idea.keyInsights && Array.isArray(idea.keyInsights) && idea.keyInsights.length > 0 && (
                  <>
                    <h5 className="font-medium text-gray-800 mb-1">Key Insights</h5>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {idea.keyInsights.map((insight, index) => (
                        <li key={index}>• {insight}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              
              <div>
                {idea.relatedPatterns && Array.isArray(idea.relatedPatterns) && idea.relatedPatterns.length > 0 && (
                  <>
                    <h5 className="font-medium text-gray-800 mb-1">Related Patterns</h5>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {idea.relatedPatterns.map((pattern, index) => (
                        <li key={index}>• {pattern}</li>
                      ))}
                    </ul>
                  </>
                )}
                
                {idea.contextConnections && Array.isArray(idea.contextConnections) && idea.contextConnections.length > 0 && (
                  <>
                    <h5 className="font-medium text-gray-800 mb-1 mt-3">Context Connections</h5>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {idea.contextConnections.map((connection, index) => (
                        <li key={index}>• {connection}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                  onClick={() => onAiIterate(idea)}
                >
                  AI Iterate
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="bg-purple-100 text-purple-800 hover:bg-purple-200"
                  onClick={() => onDiscussion(idea)}
                >
                  Discussion
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="bg-gray-100 text-gray-800 hover:bg-gray-200"
                  onClick={() => onRecategorize(idea)}
                >
                  Recategorize
                </Button>
              </div>
              {showExpandButton && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-800"
                  onClick={() => setExpandLevel(expandLevel === 2 ? 1 : 2)}
                >
                  {expandLevel === 2 ? 'Show Less' : 'Show Full Text'}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
