import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const greetingCards = pgTable("greeting_cards", {
  id: serial("id").primaryKey(),
  occasion: text("occasion").notNull(),
  recipientName: text("recipient_name").notNull(),
  senderName: text("sender_name").notNull(),
  tone: text("tone").notNull(),
  message: text("message").notNull(),
  backgroundTheme: text("background_theme").notNull(),
  customNote: text("custom_note"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertGreetingCardSchema = createInsertSchema(greetingCards).omit({
  id: true,
  createdAt: true,
});

export type InsertGreetingCard = z.infer<typeof insertGreetingCardSchema>;
export type GreetingCard = typeof greetingCards.$inferSelect;
