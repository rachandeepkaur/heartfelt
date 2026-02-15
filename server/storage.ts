import { type GreetingCard, type InsertGreetingCard, greetingCards } from "@shared/schema";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";

export interface IStorage {
  getCards(): Promise<GreetingCard[]>;
  getCard(id: number): Promise<GreetingCard | undefined>;
  createCard(card: InsertGreetingCard): Promise<GreetingCard>;
  deleteCard(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getCards(): Promise<GreetingCard[]> {
    return db.select().from(greetingCards).orderBy(desc(greetingCards.createdAt));
  }

  async getCard(id: number): Promise<GreetingCard | undefined> {
    const [card] = await db.select().from(greetingCards).where(eq(greetingCards.id, id));
    return card;
  }

  async createCard(card: InsertGreetingCard): Promise<GreetingCard> {
    const [created] = await db.insert(greetingCards).values(card).returning();
    return created;
  }

  async deleteCard(id: number): Promise<void> {
    await db.delete(greetingCards).where(eq(greetingCards.id, id));
  }
}

export const storage = new DatabaseStorage();
