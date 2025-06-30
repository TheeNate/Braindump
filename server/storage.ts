import { ideas, discussions, aiIterations, type Idea, type InsertIdea, type Discussion, type InsertDiscussion, type AiIteration, type InsertAiIteration } from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, or } from "drizzle-orm";

export interface IStorage {
  // Ideas
  createIdea(idea: InsertIdea): Promise<Idea>;
  getIdeas(): Promise<Idea[]>;
  getIdea(id: number): Promise<Idea | undefined>;
  updateIdea(id: number, updates: Partial<InsertIdea>): Promise<Idea | undefined>;
  deleteIdea(id: number): Promise<boolean>;
  getSimilarIdeas(text: string, limit?: number): Promise<Idea[]>;
  
  // Discussions
  createDiscussion(discussion: InsertDiscussion): Promise<Discussion>;
  getDiscussions(ideaId: number): Promise<Discussion[]>;
  
  // AI Iterations
  createAiIteration(iteration: InsertAiIteration): Promise<AiIteration>;
  getAiIterations(ideaId: number): Promise<AiIteration[]>;
}

export class DatabaseStorage implements IStorage {
  async createIdea(idea: InsertIdea): Promise<Idea> {
    const [newIdea] = await db
      .insert(ideas)
      .values({
        ...idea,
        updatedAt: new Date(),
      })
      .returning();
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
    const result = await db
      .delete(ideas)
      .where(eq(ideas.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getSimilarIdeas(text: string, limit = 15): Promise<Idea[]> {
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
}

export const storage = new DatabaseStorage();
