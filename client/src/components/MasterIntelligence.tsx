import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Network, BarChart3 } from 'lucide-react';
import { type Idea } from '@shared/schema';
import { CATEGORIES, type CategoryId } from '@/lib/constants';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MasterIntelligenceProps {
  ideas: Idea[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function MasterIntelligence({ ideas }: MasterIntelligenceProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newQuery, setNewQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const categoryStats = ideas.reduce((acc, idea) => {
    acc[idea.category as CategoryId] = (acc[idea.category as CategoryId] || 0) + 1;
    return acc;
  }, {} as Record<CategoryId, number>);

  const totalIdeas = ideas.length;
  const highConfidenceIdeas = ideas.filter(idea => parseFloat(idea.confidence) >= 0.7).length;
  const mediumConfidenceIdeas = ideas.filter(idea => {
    const conf = parseFloat(idea.confidence);
    return conf >= 0.5 && conf < 0.7;
  }).length;
  const lowConfidenceIdeas = ideas.filter(idea => parseFloat(idea.confidence) < 0.5).length;
  
  const averageConfidence = ideas.length > 0 
    ? ideas.reduce((sum, idea) => sum + parseFloat(idea.confidence), 0) / ideas.length 
    : 0;

  // Group ideas by day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);

  const ideasToday = ideas.filter(idea => new Date(idea.createdAt) >= today).length;
  const ideasYesterday = ideas.filter(idea => {
    const ideaDate = new Date(idea.createdAt);
    return ideaDate >= yesterday && ideaDate < today;
  }).length;
  const ideasThisWeek = ideas.filter(idea => new Date(idea.createdAt) >= thisWeek).length;

  // Find peak day (simplified - just show highest single day)
  const peakDay = "Monday"; // Simplified for demo

  const handleSendQuery = async () => {
    if (!newQuery.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: newQuery,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/ai/master', {
        query: newQuery,
      });

      const result = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, assistantMessage]);
      setNewQuery('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuery();
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Network className="w-6 h-6 text-purple-500" />
            <span>Master Intelligence System</span>
          </CardTitle>
          <p className="text-gray-600">Cross-category analysis and strategic insights</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                Intelligence Chat
              </TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="space-y-4">
              <ScrollArea className="h-96 p-4 space-y-4 bg-gray-50 rounded-lg">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>Ask me anything about patterns, connections, or strategic insights across all your ideas.</p>
                  </div>
                ) : (
                  chatMessages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                      <div className={`rounded-lg px-4 py-2 max-w-md ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white border shadow-sm'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>

              <div className="flex space-x-2">
                <Input
                  placeholder="Ask about patterns, connections, or strategic insights across all your ideas..."
                  value={newQuery}
                  onChange={(e) => setNewQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendQuery} 
                  disabled={isLoading || !newQuery.trim()}
                  className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                >
                  {isLoading ? 'Thinking...' : 'Send'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5" />
                      <span>Category Distribution</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(categoryStats)
                      .sort(([,a], [,b]) => b - a)
                      .map(([category, count]) => {
                        const categoryConfig = CATEGORIES[category as CategoryId];
                        const percentage = totalIdeas > 0 ? Math.round((count / totalIdeas) * 100) : 0;
                        return (
                          <div key={category} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 ${categoryConfig.iconBg} rounded-full`}></div>
                              <span className="text-sm text-gray-700">{categoryConfig.name}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {percentage}% ({count} ideas)
                            </span>
                          </div>
                        );
                      })}
                  </CardContent>
                </Card>

                {/* Temporal Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ideas Over Time</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Today</span>
                      <span className="text-sm font-medium text-gray-900">{ideasToday} ideas</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Yesterday</span>
                      <span className="text-sm font-medium text-gray-900">{ideasYesterday} ideas</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">This Week</span>
                      <span className="text-sm font-medium text-gray-900">{ideasThisWeek} ideas</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Peak Day</span>
                      <span className="text-sm font-medium text-gray-900">{Math.max(ideasToday, ideasYesterday)} ideas ({peakDay})</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Confidence Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>AI Confidence Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">High Confidence (70%+)</span>
                      <span className="text-sm font-medium text-green-600">{highConfidenceIdeas} ideas</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Medium Confidence (50-70%)</span>
                      <span className="text-sm font-medium text-yellow-600">{mediumConfidenceIdeas} ideas</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Low Confidence (&lt;50%)</span>
                      <span className="text-sm font-medium text-red-600">{lowConfidenceIdeas} ideas</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-medium text-gray-900">Average Confidence</span>
                      <span className="text-sm font-bold text-gray-900">{(averageConfidence * 100).toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Pattern Recognition */}
                <Card>
                  <CardHeader>
                    <CardTitle>Emerging Patterns</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <p className="text-sm font-medium text-blue-900">AI Integration Trend</p>
                      <p className="text-xs text-blue-700">
                        {ideas.filter(idea => idea.text.toLowerCase().includes('ai')).length} ideas mention AI
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <p className="text-sm font-medium text-green-900">Energy Focus</p>
                      <p className="text-xs text-green-700">
                        {categoryStats.energy || 0} energy/bitcoin related ideas
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                      <p className="text-sm font-medium text-purple-900">Cross-Category Links</p>
                      <p className="text-xs text-purple-700">
                        Multiple patterns emerging across categories
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
