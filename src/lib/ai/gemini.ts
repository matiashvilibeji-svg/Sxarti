import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { Content, Part } from "@google/generative-ai";
import type { MessageAttachment } from "@/types/database";
import { downloadAsBase64 } from "@/lib/media/storage";

export interface GeminiAction {
  type:
    | "update_stage"
    | "add_to_cart"
    | "decrement_stock"
    | "create_order"
    | "request_handoff"
    | "update_customer_info"
    | "set_delivery_zone"
    | "flag_problematic"
    | "send_product_images";
  stage?: string;
  product_id?: string;
  quantity?: number;
  reason?: string;
  customer_info?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
  };
  delivery_zone_id?: string;
}

export interface GeminiResponse {
  message: string;
  actions: GeminiAction[];
}

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    message: {
      type: SchemaType.STRING,
      description: "Response message to send to customer",
    },
    actions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: {
            type: SchemaType.STRING,
            enum: [
              "update_stage",
              "add_to_cart",
              "decrement_stock",
              "create_order",
              "request_handoff",
              "update_customer_info",
              "set_delivery_zone",
              "flag_problematic",
              "send_product_images",
            ],
          },
          stage: { type: SchemaType.STRING, nullable: true },
          product_id: { type: SchemaType.STRING, nullable: true },
          quantity: { type: SchemaType.NUMBER, nullable: true },
          reason: { type: SchemaType.STRING, nullable: true },
          delivery_zone_id: { type: SchemaType.STRING, nullable: true },
          customer_info: {
            type: SchemaType.OBJECT,
            nullable: true,
            properties: {
              name: { type: SchemaType.STRING, nullable: true },
              phone: { type: SchemaType.STRING, nullable: true },
              address: { type: SchemaType.STRING, nullable: true },
              city: { type: SchemaType.STRING, nullable: true },
            },
          },
        },
        required: ["type"],
      },
    },
  },
  required: ["message", "actions"],
};

export async function generateBotResponse(
  systemPrompt: string,
  conversationHistory: Content[],
  userMessage: string,
  attachments?: MessageAttachment[],
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite-preview",
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  // Build multimodal parts for the current message
  const userParts: Part[] = [];

  // Add media attachments as inline data (images, audio)
  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      if (attachment.type === "image" || attachment.type === "audio") {
        const mediaData = await downloadAsBase64(attachment.url);
        if (mediaData) {
          userParts.push({
            inlineData: {
              data: mediaData.data,
              mimeType: mediaData.mimeType,
            },
          });
        }
      }
    }
  }

  // Add text part (or a descriptor if no text but has attachments)
  if (userMessage) {
    userParts.push({ text: userMessage });
  } else if (userParts.length > 0) {
    // Media-only message — add context so Gemini knows to analyze the media
    userParts.push({ text: "[მომხმარებელმა გამოგზავნა მედია ფაილი]" });
  }

  // Fallback: ensure at least one part
  if (userParts.length === 0) {
    userParts.push({ text: userMessage || "" });
  }

  const contents: Content[] = [
    ...conversationHistory,
    { role: "user", parts: userParts },
  ];

  try {
    const result = await model.generateContent({ contents });
    const text = result.response.text();
    const parsed = JSON.parse(text) as GeminiResponse;

    if (!parsed.message || !Array.isArray(parsed.actions)) {
      throw new Error("Invalid response structure");
    }

    return parsed;
  } catch (error) {
    console.error("Gemini response error:", error);
    return {
      message:
        "ბოდიში, ტექნიკური შეფერხება მოხდა. გთხოვთ მოიცადოთ, ოპერატორი მალე დაგეხმარებათ.",
      actions: [{ type: "request_handoff", reason: "AI response failure" }],
    };
  }
}
