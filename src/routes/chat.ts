import { Express } from "express";
import { chatController, getChatController } from "../end-point/chat-ep";

export function initChatRoutes(app: Express) {

      
  app.post("/api/public/chat",  chatController);
  app.get("/api/public/chat/:sender/:receiver",  getChatController);
}


