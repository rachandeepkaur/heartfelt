import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGreetingCardSchema } from "@shared/schema";

const MINIMAX_API_URL = "https://api.minimax.io/v1/text/chatcompletion_v2";
const MINIMAX_IMAGE_API_URL = "https://api.minimax.io/v1/image_generation";
const MINIMAX_VIDEO_API_URL = "https://api.minimax.io/v1/video_generation";
const MINIMAX_VIDEO_QUERY_URL = "https://api.minimax.io/v1/query/video_generation";
const MINIMAX_FILE_RETRIEVE_URL = "https://api.minimax.io/v1/files/retrieve";

const SESSION_CREDIT_LIMIT = 10;

const CREDIT_COSTS: Record<string, number> = {
  "/api/cards/generate": 1,
  "/api/cards/generate-image": 2,
  "/api/cards/generate-video": 3,
};

function requireCredits(cost: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session) {
      return res.status(500).json({ error: "Session not available" });
    }

    if (req.session.creditsUsed === undefined) {
      req.session.creditsUsed = 0;
      req.session.createdAt = Date.now();
    }

    const used = req.session.creditsUsed;
    const remaining = SESSION_CREDIT_LIMIT - used;

    if (remaining < cost) {
      return res.status(429).json({
        error: "Credit limit reached",
        message: `You've used all your credits for this session. You have ${remaining} credit(s) remaining but this action requires ${cost}.`,
        creditsUsed: used,
        creditsRemaining: remaining,
        creditLimit: SESSION_CREDIT_LIMIT,
      });
    }

    next();
  };
}

function deductCredits(req: Request, cost: number) {
  if (req.session) {
    req.session.creditsUsed = (req.session.creditsUsed || 0) + cost;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/credits", (req, res) => {
    const creditsUsed = req.session?.creditsUsed || 0;
    res.json({
      creditsUsed,
      creditsRemaining: SESSION_CREDIT_LIMIT - creditsUsed,
      creditLimit: SESSION_CREDIT_LIMIT,
      costs: {
        textGeneration: CREDIT_COSTS["/api/cards/generate"],
        imageGeneration: CREDIT_COSTS["/api/cards/generate-image"],
        videoGeneration: CREDIT_COSTS["/api/cards/generate-video"],
      },
    });
  });

  app.post("/api/cards/generate", requireCredits(CREDIT_COSTS["/api/cards/generate"]), async (req, res) => {
    try {
      const { occasion, recipientName, senderName, tone, customNote } = req.body;

      if (!occasion || !recipientName || !senderName || !tone) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const prompt = `You are a creative greeting card writer. Write a heartfelt, beautiful greeting card message for the following:

Occasion: ${occasion}
Recipient: ${recipientName}
From: ${senderName}
Tone: ${tone}
${customNote ? `Special details: ${customNote}` : ""}

Guidelines:
- Write 3-5 lines of emotionally resonant text
- Match the ${tone} tone perfectly
- Make it feel personal and genuine, not generic
- Use poetic language if the tone is poetic
- Use humor tastefully if the tone is funny
- Be warm and sincere for heartfelt tone
- Be romantic and tender for romantic tone
- Do NOT include "Dear [name]" or "Love, [name]" - just the message body
- Do NOT use quotation marks around the message
- Keep it concise but impactful`;

      const apiKey = process.env.MINIMAX_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "MiniMax API key not configured" });
      }

      const response = await fetch(MINIMAX_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "MiniMax-M2.5",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("MiniMax API error:", response.status, errorText);
        return res.status(502).json({ error: "AI service returned an error" });
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const message = data.choices?.[0]?.message?.content?.trim() || "Every moment with you is a gift.";

      deductCredits(req, CREDIT_COSTS["/api/cards/generate"]);
      const creditsUsed = req.session?.creditsUsed || 0;
      res.json({ message, creditsUsed, creditsRemaining: SESSION_CREDIT_LIMIT - creditsUsed });
    } catch (error) {
      console.error("Error generating card message:", error);
      res.status(500).json({ error: "Failed to generate message" });
    }
  });

  app.post("/api/cards/generate-image", requireCredits(CREDIT_COSTS["/api/cards/generate-image"]), async (req, res) => {
    try {
      const { customNote, occasion } = req.body;

      if (!customNote) {
        return res.status(400).json({ error: "Custom note is required for image generation" });
      }

      const apiKey = process.env.MINIMAX_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "MiniMax API key not configured" });
      }

      const imagePrompt = `A beautiful, artistic greeting card illustration for a ${occasion || "special"} occasion. The art should feature: ${customNote}. Style: dreamy, elegant, soft watercolor and digital art blend, warm lighting, rich colors, visually stunning, no text or words in the image.`;

      const response = await fetch(MINIMAX_IMAGE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "image-01",
          prompt: imagePrompt,
          aspect_ratio: "3:4",
          n: 1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("MiniMax Image API error:", response.status, errorText);
        return res.status(502).json({ error: "Image generation service returned an error" });
      }

      const data = await response.json() as {
        data?: { image_urls?: string[] };
        base_resp?: { status_code?: number; status_msg?: string };
      };

      if (data.base_resp?.status_code !== 0) {
        console.error("MiniMax Image API error response:", data.base_resp);
        return res.status(502).json({ error: "Image generation failed" });
      }

      const imageUrl = data.data?.image_urls?.[0];
      if (!imageUrl) {
        return res.status(502).json({ error: "No image was generated" });
      }

      deductCredits(req, CREDIT_COSTS["/api/cards/generate-image"]);
      const creditsUsed = req.session?.creditsUsed || 0;
      res.json({ imageUrl, creditsUsed, creditsRemaining: SESSION_CREDIT_LIMIT - creditsUsed });
    } catch (error) {
      console.error("Error generating card image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  app.post("/api/cards/generate-video", requireCredits(CREDIT_COSTS["/api/cards/generate-video"]), async (req, res) => {
    try {
      const { firstFrameImageUrl, lastFrameImageBase64, prompt } = req.body;

      if (!firstFrameImageUrl || !lastFrameImageBase64 || !prompt) {
        return res.status(400).json({ error: "Missing required fields for video generation" });
      }

      const apiKey = process.env.MINIMAX_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "MiniMax API key not configured" });
      }

      const response = await fetch(MINIMAX_VIDEO_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "MiniMax-Hailuo-02",
          prompt,
          first_frame_image: firstFrameImageUrl,
          last_frame_image: lastFrameImageBase64,
          duration: 6,
          resolution: "1080P",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("MiniMax Video API error:", response.status, errorText);
        return res.status(502).json({ error: "Video generation service returned an error" });
      }

      const data = await response.json() as {
        task_id?: string;
        base_resp?: { status_code?: number; status_msg?: string };
      };

      if (data.base_resp && data.base_resp.status_code !== 0) {
        console.error("MiniMax Video API error response:", data.base_resp);
        return res.status(502).json({ error: data.base_resp.status_msg || "Video generation failed" });
      }

      if (!data.task_id) {
        return res.status(502).json({ error: "No task ID returned from video generation" });
      }

      deductCredits(req, CREDIT_COSTS["/api/cards/generate-video"]);
      const creditsUsed = req.session?.creditsUsed || 0;
      res.json({ taskId: data.task_id, creditsUsed, creditsRemaining: SESSION_CREDIT_LIMIT - creditsUsed });
    } catch (error) {
      console.error("Error submitting video generation task:", error);
      res.status(500).json({ error: "Failed to submit video generation" });
    }
  });

  app.get("/api/cards/video-status/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;

      const apiKey = process.env.MINIMAX_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "MiniMax API key not configured" });
      }

      const statusResponse = await fetch(`${MINIMAX_VIDEO_QUERY_URL}?task_id=${taskId}`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error("MiniMax Video status error:", statusResponse.status, errorText);
        return res.status(502).json({ error: "Failed to check video status" });
      }

      const statusData = await statusResponse.json() as {
        status?: string;
        file_id?: string;
        base_resp?: { status_code?: number; status_msg?: string };
      };

      const status = statusData.status;

      if (status === "Success" && statusData.file_id) {
        const fileResponse = await fetch(`${MINIMAX_FILE_RETRIEVE_URL}?file_id=${statusData.file_id}`, {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        });

        if (!fileResponse.ok) {
          return res.status(502).json({ error: "Failed to retrieve video file" });
        }

        const fileData = await fileResponse.json() as {
          file?: { download_url?: string };
        };

        const downloadUrl = fileData.file?.download_url;
        if (!downloadUrl) {
          return res.status(502).json({ error: "No download URL for video" });
        }

        return res.json({ status: "completed", videoUrl: downloadUrl });
      }

      if (status === "Fail") {
        return res.json({ status: "failed", error: statusData.base_resp?.status_msg || "Video generation failed" });
      }

      res.json({ status: "processing" });
    } catch (error) {
      console.error("Error checking video status:", error);
      res.status(500).json({ error: "Failed to check video status" });
    }
  });

  app.get("/api/cards", async (_req, res) => {
    try {
      const cards = await storage.getCards();
      res.json(cards);
    } catch (error) {
      console.error("Error fetching cards:", error);
      res.status(500).json({ error: "Failed to fetch cards" });
    }
  });

  app.get("/api/cards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const card = await storage.getCard(id);
      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }
      res.json(card);
    } catch (error) {
      console.error("Error fetching card:", error);
      res.status(500).json({ error: "Failed to fetch card" });
    }
  });

  app.post("/api/cards", async (req, res) => {
    try {
      const parsed = insertGreetingCardSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid card data", details: parsed.error.issues });
      }
      const card = await storage.createCard(parsed.data);
      res.status(201).json(card);
    } catch (error) {
      console.error("Error creating card:", error);
      res.status(500).json({ error: "Failed to create card" });
    }
  });

  app.delete("/api/cards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCard(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting card:", error);
      res.status(500).json({ error: "Failed to delete card" });
    }
  });

  return httpServer;
}
