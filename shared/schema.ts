import { pgTable, text, serial, integer, boolean, decimal, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const ideas = pgTable("ideas", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  category: text("category").notNull().default("uncategorized"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull().default("0"),
  reasoning: text("reasoning"),
  keyInsights: jsonb("key_insights").default([]),
  relatedPatterns: jsonb("related_patterns").default([]),
  contextConnections: jsonb("context_connections").default([]),
  userFeedback: text("user_feedback"),
  manuallyRecategorized: boolean("manually_recategorized").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const discussions = pgTable("discussions", {
  id: serial("id").primaryKey(),
  ideaId: integer("idea_id").references(() => ideas.id, { onDelete: "cascade" }).notNull(),
  sender: text("sender").notNull(), // 'nate' or 'janae'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiIterations = pgTable("ai_iterations", {
  id: serial("id").primaryKey(),
  ideaId: integer("idea_id").references(() => ideas.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ideasRelations = relations(ideas, ({ many }) => ({
  discussions: many(discussions),
  aiIterations: many(aiIterations),
}));

export const discussionsRelations = relations(discussions, ({ one }) => ({
  idea: one(ideas, {
    fields: [discussions.ideaId],
    references: [ideas.id],
  }),
}));

export const aiIterationsRelations = relations(aiIterations, ({ one }) => ({
  idea: one(ideas, {
    fields: [aiIterations.ideaId],
    references: [ideas.id],
  }),
}));

export const insertIdeaSchema = createInsertSchema(ideas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDiscussionSchema = createInsertSchema(discussions).omit({
  id: true,
  createdAt: true,
});

export const insertAiIterationSchema = createInsertSchema(aiIterations).omit({
  id: true,
  createdAt: true,
});

export type Idea = typeof ideas.$inferSelect;
export type InsertIdea = z.infer<typeof insertIdeaSchema>;
export type Discussion = typeof discussions.$inferSelect;
export type InsertDiscussion = z.infer<typeof insertDiscussionSchema>;
export type AiIteration = typeof aiIterations.$inferSelect;
export type InsertAiIteration = z.infer<typeof insertAiIterationSchema>;
