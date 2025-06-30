import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Network, 
  Mic, 
  AlertTriangle,
  TrendingUp,
  Target,
  Zap,
  Brain,
  FileText,
  Lightbulb
} from 'lucide-react';
import { type Idea } from '@shared/schema';
import { CATEGORIES, type CategoryId } from '@/lib/constants';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { CategorySection } from '@/components/CategorySection';
import { RecategorizationModal } from '@/components/RecategorizationModal';
import { AiIterateChat } from '@/components/AiIterateChat';
import { DiscussionChat } from '@/components/DiscussionChat';
import { MasterIntelligence } from '@/components/MasterIntelligence';

export default function Home() {
  const [activeTab, setActiveTab] = useState('capture');
  const [ideaText, setIdeaText] = useState('');
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [showRecategorization, setShowRecategorization] = useState(false);
  const [showAiIterate, setShowAiIterate] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isRecording, transcript, isSupported, startRecording, stopRecording, clearTranscript } = useVoiceInput();

  // Queries
  const { data: ideas = [], isLoading } = useQuery<Idea[]>({
    queryKey: ['/api/ideas'],
  });

  // Mutations
  const createIdeaMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest('POST', '/api/ideas', { text });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ideas'] });
      setIdeaText('');
      clearTranscript();
      toast({
        title: "Success",
        description: "Idea captured and categorized!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create idea",
        variant: "destructive",
      });
    },
  });

  const deleteIdeaMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/ideas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ideas'] });
      toast({
        title: "Success",
        description: "Idea deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete idea",
        variant: "destructive",
      });
    },
  });

  // Update textarea with voice transcript
  useEffect(() => {
    if (transcript) {
      setIdeaText(transcript);
    }
  }, [transcript]);

  // Group ideas by category
  const ideasByCategory = ideas.reduce((acc, idea) => {
    const category = idea.category as CategoryId;
    if (!acc[category]) acc[category] = [];
    acc[category].push(idea);
    return acc;
  }, {} as Record<CategoryId, Idea[]>);

  // Calculate stats
  const categoryStats = Object.entries(CATEGORIES).map(([key, category]) => ({
    ...category,
    count: ideasByCategory[key as CategoryId]?.length || 0,
  }));

  const lowConfidenceCount = ideas.filter(idea => parseFloat(idea.confidence) < 0.5).length;

  const handleSubmitIdea = () => {
    if (!ideaText.trim()) return;
    createIdeaMutation.mutate(ideaText.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitIdea();
    }
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleRecategorize = (idea: Idea) => {
    setSelectedIdea(idea);
    setShowRecategorization(true);
  };

  const handleAiIterate = (idea: Idea) => {
    setSelectedIdea(idea);
    setShowAiIterate(true);
  };

  const handleDiscussion = (idea: Idea) => {
    setSelectedIdea(idea);
    setShowDiscussion(true);
  };

  const handleDelete = (id: number) => {
    deleteIdeaMutation.mutate(id);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/ideas'] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your ideas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Brain Dump & Idea Organizer</h1>
                <p className="text-sm text-gray-500">AI-Powered Personal Intelligence System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={activeTab === 'capture' ? 'default' : 'outline'}
                onClick={() => setActiveTab('capture')}
                className={activeTab === 'capture' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : ''}
              >
                <Plus className="w-4 h-4 mr-2" />
                Capture Ideas
              </Button>
              <Button
                variant={activeTab === 'master' ? 'default' : 'outline'}
                onClick={() => setActiveTab('master')}
                className={activeTab === 'master' ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white' : ''}
              >
                <Network className="w-4 h-4 mr-2" />
                Master Intelligence
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="capture" className="space-y-8">
            {/* Input Section */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Capture Your Ideas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="What's on your mind? Dump your ideas here..."
                    value={ideaText}
                    onChange={(e) => setIdeaText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[120px] text-gray-900 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all duration-200"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    Press Enter or click Submit
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isSupported && (
                      <Button
                        variant={isRecording ? 'destructive' : 'outline'}
                        onClick={handleVoiceToggle}
                        className={isRecording ? 'animate-pulse' : ''}
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        {isRecording ? 'Recording...' : 'Voice Input'}
                      </Button>
                    )}
                    {isRecording && (
                      <span className="text-sm text-gray-500">Real-time transcription active</span>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleSubmitIdea} 
                    disabled={!ideaText.trim() || createIdeaMutation.isPending}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {createIdeaMutation.isPending ? 'Processing...' : 'Submit Idea'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Category Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {categoryStats.map((category) => {
                const iconMap = {
                  TrendingUp,
                  Target,
                  Zap,
                  Brain,
                  FileText,
                };
                const Icon = iconMap[category.icon as keyof typeof iconMap];
                
                return (
                  <Card key={category.id} className={`${category.bgColor} ${category.borderColor} border text-center`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-center mb-2">
                        <div className={`w-8 h-8 ${category.iconBg} rounded-full flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className={`text-2xl font-bold ${category.textColor}`}>{category.count}</div>
                      <div className="text-sm text-gray-600">{category.name}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Manual Review Alert */}
            {lowConfidenceCount > 0 && (
              <Alert className="bg-orange-50 border-orange-200">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <AlertDescription className="text-orange-800">
                  <span className="font-medium">Manual Review Required</span> - {lowConfidenceCount} idea{lowConfidenceCount > 1 ? 's' : ''} need{lowConfidenceCount === 1 ? 's' : ''} manual categorization (confidence below 50%)
                </AlertDescription>
              </Alert>
            )}

            {/* Ideas by Category */}
            <div className="space-y-6">
              {Object.entries(CATEGORIES).map(([categoryKey, category]) => {
                const categoryIdeas = ideasByCategory[categoryKey as CategoryId] || [];
                if (categoryIdeas.length === 0) return null;
                
                return (
                  <CategorySection
                    key={categoryKey}
                    category={categoryKey as CategoryId}
                    ideas={categoryIdeas}
                    onRecategorize={handleRecategorize}
                    onAiIterate={handleAiIterate}
                    onDiscussion={handleDiscussion}
                    onDelete={handleDelete}
                  />
                );
              })}
            </div>

            {ideas.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No ideas yet</h3>
                  <p className="text-gray-600">Start by capturing your first idea above!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="master">
            <MasterIntelligence ideas={ideas} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <RecategorizationModal
        isOpen={showRecategorization}
        onClose={() => setShowRecategorization(false)}
        idea={selectedIdea}
        onSuccess={handleModalSuccess}
      />
      
      <AiIterateChat
        isOpen={showAiIterate}
        onClose={() => setShowAiIterate(false)}
        idea={selectedIdea}
      />
      
      <DiscussionChat
        isOpen={showDiscussion}
        onClose={() => setShowDiscussion(false)}
        idea={selectedIdea}
      />
    </div>
  );
}
