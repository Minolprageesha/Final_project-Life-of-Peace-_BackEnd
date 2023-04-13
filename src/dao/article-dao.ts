import { Types } from "mongoose";
import { DArticle, IArticle } from "../models/article-model";
import Article from "../schemas/article-schema";
import { StringOrObjectId } from "../common/util";
import { AppLogger } from "../common/logging";
import Upload from "../schemas/upload-schema";
import { UserDao } from "./user-dao";
import { ArticleEp } from "../end-point/article-ep";

export namespace ArticleDao {
  const populateOptions = [
    {
      path: "uploadId",
    },
    {
      path: "createdBy",
      populate: [{ path: "photoId" }],
      select: {
        firstname: 1,
        lastname: 1,
        photoId: 1,
        url: 1,
        blockedByAdmin: 1,
      },
    },
  ];


  export async function getAllArticle(){
    let articleCount = await Article.count()
    return articleCount;
  }


  export async function getArticleByArticleIdPublic(
    id: Types.ObjectId,
  ): Promise<IArticle> {
    let article: IArticle = await Article.findById(id).populate(populateOptions);

    return article;
  }


  export async function addArticle(
    articleDetails: DArticle
  ): Promise<IArticle> {
    const iArticle = new Article(articleDetails);
    let response = await iArticle.save();

    return response;
  }


  export async function getAllArticlesPublic(
    limit: number,
    offset: number,
  ): Promise<IArticle[]> {
    const articles = await Article.find()
      .populate(populateOptions)
      .skip(limit * (offset - 1))
      .sort({ createdAt: -1 })
      .limit(limit);
      
    return articles;
  }

}
