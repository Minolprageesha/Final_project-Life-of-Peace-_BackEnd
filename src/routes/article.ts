import { Express } from "express";
import { ArticleEp } from "../end-point/article-ep";
import { Authentication } from "../middleware/authentication";

export function initArticleRoutes(app: Express) {
  app.post(
    "/api/auth/addArticle",
    Authentication.therapistVerification,
    ArticleEp.addArticle
  );

  app.get("/api/public/getArticleById/:id", ArticleEp.getArticleByIdPublic);

  app.get("/api/public/getAllArticlesPublic/:limit/:offset", ArticleEp.getAllArticlePublic);

}
