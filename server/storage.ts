import { ideas, discussions, aiIterations, type Idea, type InsertIdea, type Discussion, type InsertDiscussion, type AiIteration, type InsertAiIteration } from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, or } from "drizzle-orm";
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const PINECONE_INDEX = process.env.PINECONE_INDEX_NAME || 'ideas-index';

export interface IStorage {
  // Ideas
  createIdea(idea: InsertIdea): Promise<Idea>;
  getIdeas(): Promise<Idea[]>;
  getIdea(id: number): Promise<Idea | undefined>;
  updateIdea(id: number, updates: Partial<InsertIdea>): Promise<Idea | undefined>;
  deleteIdea(id: number): Promise<boolean>;
  getSimilarIdeas(text: string, limit?: number): Promise<Idea[]>;
  
  // Vector operations
  createEmbedding(text: string): Promise<number[]>;
  storeIdeaVector(ideaId: number, text: string): Promise<void>;
  findSimilarVectors(text: string, limit?: number): Promise<Idea[]>;
  deleteIdeaVector(ideaId: number): Promise<void>;
  
  // Discussions
  createDiscussion(discussion: InsertDiscussion): Promise<Discussion>;
  getDiscussions(ideaId: number): Promise<Discussion[]>;
  
  // AI Iterations
  createAiIteration(iteration: InsertAiIteration): Promise<AiIteration>;
  getAiIterations(ideaId: number): Promise<AiIteration[]>;
}

export class DatabaseStorage implements IStorage {
  async createIdea(idea: InsertIdea): Promise<Idea> {
    console.log('🚀 Starting createIdea for:', idea.text.substring(0, 50) + '...');
    
    const [newIdea] = await db
      .insert(ideas)
      .values({
        ...idea,
        updatedAt: new Date(),
      })
      .returning();
    
    console.log('✅ Idea saved to database with ID:', newIdea.id);
    
    // Store vector embedding
    try {
      console.log('🔄 Attempting to store vector embedding...');
      await this.storeIdeaVector(newIdea.id, newIdea.text);
      console.log('✅ Vector embedding stored successfully');
    } catch (error) {
      console.error('❌ Failed to store vector embedding:', error);
      console.error('❌ Full error details:', error);
    }
    
    return newIdea;
  }

  async getIdeas(): Promise<Idea[]> {
    return await db
      .select()
      .from(ideas)
      .orderBy(desc(ideas.createdAt));
  }

  async getIdea(id: number): Promise<Idea | undefined> {
    const [idea] = await db
      .select()
      .from(ideas)
      .where(eq(ideas.id, id));
    return idea || undefined;
  }

  async updateIdea(id: number, updates: Partial<InsertIdea>): Promise<Idea | undefined> {
    const [updatedIdea] = await db
      .update(ideas)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(ideas.id, id))
      .returning();
    return updatedIdea || undefined;
  }

  async deleteIdea(id: number): Promise<boolean> {
    // Delete vector embedding first
    try {
      await this.deleteIdeaVector(id);
    } catch (error) {
      console.error('Failed to delete vector embedding:', error);
    }
    
    const result = await db
      .delete(ideas)
      .where(eq(ideas.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getSimilarIdeas(text: string, limit = 15): Promise<Idea[]> {
    try {
      // Use vector similarity search for semantic matching
      return await this.findSimilarVectors(text, limit);
    } catch (error) {
      console.error('Vector search failed, falling back to keyword search:', error);
      
      // Fallback to keyword search if vector search fails
      const keywords = text.toLowerCase().split(' ').filter(word => word.length > 3);
      if (keywords.length === 0) return [];
      
      const conditions = keywords.map(keyword => 
        like(ideas.text, `%${keyword}%`)
      );
      
      return await db
        .select()
        .from(ideas)
        .where(or(...conditions))
        .orderBy(desc(ideas.createdAt))
        .limit(limit);
    }
  }

  async createDiscussion(discussion: InsertDiscussion): Promise<Discussion> {
    const [newDiscussion] = await db
      .insert(discussions)
      .values(discussion)
      .returning();
    return newDiscussion;
  }

  async getDiscussions(ideaId: number): Promise<Discussion[]> {
    return await db
      .select()
      .from(discussions)
      .where(eq(discussions.ideaId, ideaId))
      .orderBy(discussions.createdAt);
  }

  async createAiIteration(iteration: InsertAiIteration): Promise<AiIteration> {
    const [newIteration] = await db
      .insert(aiIterations)
      .values(iteration)
      .returning();
    return newIteration;
  }

  async getAiIterations(ideaId: number): Promise<AiIteration[]> {
    return await db
      .select()
      .from(aiIterations)
      .where(eq(aiIterations.ideaId, ideaId))
      .orderBy(aiIterations.createdAt);
  }

  async createEmbedding(text: string): Promise<number[]> {
    console.log('🔄 Creating embedding for text:', text.substring(0, 100) + '...');
    console.log('🔑 OpenAI API key available:', !!process.env.OPENAI_API_KEY);
    
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });
      
      console.log('✅ Embedding created, length:', response.data[0].embedding.length);
      return response.data[0].embedding;
    } catch (error) {
      console.error('❌ Failed to create embedding:', error);
      throw error;
    }
  }

  async storeIdeaVector(ideaId: number, text: string): Promise<void> {
    console.log('🔄 Storing vector for idea ID:', ideaId);
    console.log('🔑 Pinecone API key available:', !!process.env.PINECONE_API_KEY);
    console.log('🗂️ Using index name:', PINECONE_INDEX);
    
    try {
      const embedding = await this.createEmbedding(text);
      const index = pinecone.index(PINECONE_INDEX);
      
      console.log('🔄 Upserting to Pinecone...');
      await index.upsert([{
        id: ideaId.toString(),
        values: embedding,
        metadata: {
          text: text.substring(0, 1000), // Store truncated text as metadata
          ideaId: ideaId,
        }
      }]);
      
      console.log('✅ Vector stored in Pinecone successfully');
    } catch (error) {
      console.error('❌ Failed to store vector in Pinecone:', error);
      throw error;
    }
  }

  async findSimilarVectors(text: string, limit = 15): Promise<Idea[]> {
    const embedding = await this.createEmbedding(text);
    const index = pinecone.index(PINECONE_INDEX);
    
    const queryResponse = await index.query({
      vector: embedding,
      topK: limit,
      includeMetadata: true,
    });

    // Get the idea IDs from Pinecone results
    const ideaIds = queryResponse.matches
      ?.filter(match => match.score && match.score > 0.7) // Filter by similarity threshold
      .map(match => parseInt(match.id))
      .filter(id => !isNaN(id)) || [];

    if (ideaIds.length === 0) return [];

    // Fetch full idea details from PostgreSQL
    const similarIdeas = await db
      .select()
      .from(ideas)
      .where(or(...ideaIds.map(id => eq(ideas.id, id))))
      .orderBy(desc(ideas.createdAt));

    return similarIdeas;
  }

  async deleteIdeaVector(ideaId: number): Promise<void> {
    const index = pinecone.index(PINECONE_INDEX);
    await index.deleteOne(ideaId.toString());
  }
}

export const storage = new DatabaseStorage();
