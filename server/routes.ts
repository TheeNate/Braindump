import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { categorizeIdea, iterateOnIdea, getMasterIntelligence } from "./services/ai";
import { insertIdeaSchema, insertDiscussionSchema, insertAiIterationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Debug endpoint for environment variables
  app.get('/api/debug-env', (req, res) => {
    res.json({
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasPinecone: !!process.env.PINECONE_API_KEY,
      openAIKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) + '...',
      pineconeKeyPrefix: process.env.PINECONE_API_KEY?.substring(0, 10) + '...',
      indexName: process.env.PINECONE_INDEX_NAME || 'ideas-index',
      nodeEnv: process.env.NODE_ENV
    });
  });

  // Ideas endpoints
  app.post("/api/ideas", async (req, res) => {
    try {
      const ideaData = insertIdeaSchema.parse(req.body);
      
      // Get similar ideas for AI context
      const similarIdeas = await storage.getSimilarIdeas(ideaData.text);
      
      // Get AI categorization if not manually set
      if (!ideaData.category || ideaData.category === "uncategorized") {
        const aiResult = await categorizeIdea(ideaData.text, similarIdeas);
        
        const idea = await storage.createIdea({
          ...ideaData,
          category: aiResult.category,
          confidence: aiResult.confidence.toString(),
          reasoning: aiResult.reasoning,
          keyInsights: aiResult.keyInsights,
          relatedPatterns: aiResult.relatedPatterns,
          contextConnections: aiResult.contextConnections,
        });
        
        res.json(idea);
      } else {
        // Manual categorization
        const idea = await storage.createIdea({
          ...ideaData,
          confidence: "1.0",
          manuallyRecategorized: true,
        });
        
        res.json(idea);
      }
    } catch (error) {
      console.error("Error creating idea:", error);
      res.status(400).json({ message: "Failed to create idea" });
    }
  });

  app.get("/api/ideas", async (req, res) => {
    try {
      const ideas = await storage.getIdeas();
      res.json(ideas);
    } catch (error) {
      console.error("Error fetching ideas:", error);
      res.status(500).json({ message: "Failed to fetch ideas" });
    }
  });

  app.get("/api/ideas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const idea = await storage.getIdea(id);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      res.json(idea);
    } catch (error) {
      console.error("Error fetching idea:", error);
      res.status(500).json({ message: "Failed to fetch idea" });
    }
  });

  app.put("/api/ideas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertIdeaSchema.partial().parse(req.body);
      
      // If recategorizing, set confidence to 100% and mark as manually recategorized
      if (updates.category) {
        updates.confidence = "1.0";
        updates.manuallyRecategorized = true;
      }
      
      const idea = await storage.updateIdea(id, updates);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      res.json(idea);
    } catch (error) {
      console.error("Error updating idea:", error);
      res.status(400).json({ message: "Failed to update idea" });
    }
  });

  app.delete("/api/ideas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteIdea(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting idea:", error);
      res.status(500).json({ message: "Failed to delete idea" });
    }
  });

  // AI endpoints
  app.post("/api/ai/categorize", async (req, res) => {
    try {
      const { text } = z.object({ text: z.string() }).parse(req.body);
      const similarIdeas = await storage.getSimilarIdeas(text);
      const result = await categorizeIdea(text, similarIdeas);
      res.json(result);
    } catch (error) {
      console.error("Error categorizing idea:", error);
      res.status(500).json({ message: "Failed to categorize idea" });
    }
  });

  app.post("/api/ai/iterate", async (req, res) => {
    try {
      const { ideaId, message } = z.object({
        ideaId: z.number(),
        message: z.string(),
      }).parse(req.body);
      
      const idea = await storage.getIdea(ideaId);
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      // Save user message
      await storage.createAiIteration({
        ideaId,
        role: "user",
        content: message,
      });
      
      // Get conversation history
      const history = await storage.getAiIterations(ideaId);
      const conversationHistory = history.map(h => ({ role: h.role, content: h.content }));
      
      // Get AI response
      const aiResponse = await iterateOnIdea(idea.text, conversationHistory);
      
      // Save AI response
      const iteration = await storage.createAiIteration({
        ideaId,
        role: "assistant",
        content: aiResponse,
      });
      
      res.json(iteration);
    } catch (error) {
      console.error("Error in AI iteration:", error);
      res.status(500).json({ message: "Failed to process AI iteration" });
    }
  });

  app.post("/api/ai/master", async (req, res) => {
    try {
      const { query } = z.object({ query: z.string() }).parse(req.body);
      
      const allIdeas = await storage.getIdeas();
      const conversationHistory: { role: string; content: string }[] = []; // TODO: Implement master chat history
      
      const response = await getMasterIntelligence(query, allIdeas, conversationHistory);
      res.json({ response });
    } catch (error) {
      console.error("Error in master intelligence:", error);
      res.status(500).json({ message: "Failed to process master intelligence query" });
    }
  });

  // Discussions endpoints
  app.post("/api/discussions", async (req, res) => {
    try {
      const discussionData = insertDiscussionSchema.parse(req.body);
      const discussion = await storage.createDiscussion(discussionData);
      res.json(discussion);
    } catch (error) {
      console.error("Error creating discussion:", error);
      res.status(400).json({ message: "Failed to create discussion" });
    }
  });

  app.get("/api/discussions/:ideaId", async (req, res) => {
    try {
      const ideaId = parseInt(req.params.ideaId);
      const discussions = await storage.getDiscussions(ideaId);
      res.json(discussions);
    } catch (error) {
      console.error("Error fetching discussions:", error);
      res.status(500).json({ message: "Failed to fetch discussions" });
    }
  });

  // AI Iterations endpoints
  app.get("/api/ai-iterations/:ideaId", async (req, res) => {
    try {
      const ideaId = parseInt(req.params.ideaId);
      const iterations = await storage.getAiIterations(ideaId);
      res.json(iterations);
    } catch (error) {
      console.error("Error fetching AI iterations:", error);
      res.status(500).json({ message: "Failed to fetch AI iterations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
