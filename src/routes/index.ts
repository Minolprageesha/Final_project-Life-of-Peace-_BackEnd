import { Express, Request, Response } from "express";
import { initAdminRoutes } from "./admin";
import { initClientRoutes } from "./Client";
import { initRequestRoutes } from "./friend-request";
import { initTherapistRoutes } from "./Therapist";
import { initUploadRoutes } from "./upload";
import { initUserRoutes } from "./user";
import { initArticleRoutes } from "./article";
import { initChatRoutes } from "./chat";
export function initRoutes(app: Express) {
  /* TOP LEVEL */
  app.get("/api", (req: Request, res: Response) =>
    res.sendSuccess("LifeOfPease™ Api", "Success")
  );

  initUploadRoutes(app);
  initUserRoutes(app);
  initClientRoutes(app);
  initRequestRoutes(app);
  initAdminRoutes(app);
  initTherapistRoutes(app);
  initArticleRoutes(app);
  initChatRoutes(app);
  /* ALL INVALID REQUESTS */
  app.get("/", (req: Request, res: Response) => res.redirect(301, "/api"));
  app.all("*", (req: Request, res: Response) =>
    res.sendError("Route Not Found")
  );
}
