import { NextFunction, Request, Response } from "express";
import { check, validationResult } from "express-validator";
import { Types } from "mongoose";
import multer = require("multer");
import path = require("path");
import { AdminDao } from "../dao/admin-dao";
import { ArticleDao } from "../dao/article-dao";
import { TherapistDao } from "../dao/therapist-dao";
import { UploadDao } from "../dao/upload-dao";
import { UserDao } from "../dao/user-dao";
import { EmailService } from "../mail/config";
import { DArticle } from "../models/article-model";
import { DUpload } from "../models/upload-model";
import { UserRole } from "../models/user-model";
import { UploadCategory } from "./user-ep";
let mongoose = require("mongoose");
let fs = require("fs");

export namespace ArticleEp {
  export function searchArticlesByTagsValidationRules() {
    return [
      check("searchTags").isArray().withMessage("Search tags are required."),
      check("type").isString().not().isEmpty().withMessage("Type is required."),
    ];
  }

  export function addReplyValidationRules() {
    return [
      check("articleId").not().isEmpty().withMessage("Article Id is required."),
    ];
  }

  export async function addArticle(req: Request, res: Response, next: NextFunction) {
    const userId = req.user._id;
    let destination1 = `${process.env.UPLOAD_PATH}/${UploadCategory.ARTICLE_IMAGE}`;

    fs.access(destination1, (error: any) => {
      if (error) {
        return fs.mkdir(destination1, (error: any) => {
          return true;
        });
      }
    });

    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        await articleValidationRules(req, file, cb);
      },
    });

    async function articleValidationRules(req: any, file: any, cb: any) {
      try {
        let articleDetails = JSON.parse(req.body.articleDetails);

        if (!articleDetails.articleTitle || typeof articleDetails.articleTitle !== "string") {
          return cb(Error("Article title is required."));
        }

        if (!articleDetails.articleBody || typeof articleDetails.articleBody !== "string") {
          return cb(Error("Article body is required."));
        }

        if (file.fieldname === "articleFile") {
          cb(null, destination1);
        }
      } catch (error) {
        return cb(Error(error), null);
      }
    }

    const upload = multer({
      storage: storage,
    }).fields([{ name: "articleFile", maxCount: 1 }]);

    try {
      upload(req, res, async function (error: any) {
        if (error) {
          return res.sendError(error + "");
        }

        const fileType = req.body.fileType;

        let uploadedArticleFile;

        if (fileType === "IMAGE") {
          if ((req.files as any).articleFile.length <= 0) {
            return res.sendError("Article image or video is required.");
          }

          const upload: any = (req.files as any).articleFile[0];

          const articleFile: DUpload = {
            userId: userId as unknown as Types.ObjectId,
            originalName: upload.originalname.replace(/ /g, ""),
            name: upload.filename,
            type: upload.mimetype,
            path: upload.path,
            fileSize: upload.size,
            extension: path.extname(upload.originalname),
            category: UploadCategory.ARTICLE_IMAGE,
          };

          uploadedArticleFile = await UploadDao.createUpload(articleFile);
        }

        let requestBody: any;

        try {
          requestBody = JSON.parse(req.body.articleDetails);
        } catch (error) {
          return res.sendError("Invalid article details.");
        }


        let article: DArticle;

          article = {
            createdBy: userId,
            articleTitle: requestBody.articleTitle,
            articleBody: requestBody.articleBody,
            uploadId: uploadedArticleFile._id,
          };

        try {
          let savedArticle = await ArticleDao.addArticle(article);

          if (!savedArticle) {
            return res.sendError("Error while saving article details.");
          }

          const therapist = await UserDao.getUserById(userId);

          const clientsList = await AdminDao.getAllClients(-1, 0);

          const customEmailArray: { to: { email: any }[] }[] = [];

          await Promise.all(
            clientsList.map(async (client: any) => {
              customEmailArray.push({ to: [{ email: client.email }] });
            })
          );

          // await EmailService.newPostInDiscover(
          //   "Lavni - New blog post created by " + therapist.firstname + " " + therapist.lastname,
          //   requestBody.articleTitle,
          //   therapist.firstname + " " + therapist.lastname,
          //   savedArticle._id,
          //   customEmailArray
          // );

          return res.sendSuccess(savedArticle, "Article saved.");
        } catch (error) {
          return res.sendError(error);
        }
      });
    } catch (error) {
      return res.sendError(error);
    }
  }





  export async function getAllArticlePublic(req: Request, res: Response, next: NextFunction) {
    const  shuffle = (array:any)=> {
      var currentIndex = array.length
       , temporaryValue
       , randomIndex
       ;
   
     while (0 !== currentIndex) {
       randomIndex = Math.floor(Math.random() * currentIndex);
       currentIndex -= 1;
   
       temporaryValue = array[currentIndex];
       array[currentIndex] = array[randomIndex];
       array[randomIndex] = temporaryValue;
     }
   
     return array;
   }
    const limit = Number(req.params.limit);
    const offset = Number(req.params.offset);
  
    try {
      const articles = await ArticleDao.getAllArticlesPublic(limit, offset);
      const row =  shuffle(articles)
      if (articles.length === 0) {
        return res.sendError("Something went wrong! Could not load articles.");
      }
      return res.sendSuccess(row, "Success");
   
    } catch (error) {
      return res.sendError(error);
    }
  }


  export async function getArticleByIdPublic(req: Request, res: Response, next: NextFunction) {
    const articleId = Types.ObjectId(req.params.id);

    try {
      let article = await ArticleDao.getArticleByArticleIdPublic(articleId);

      if (!article) {
        return res.sendError("No article found for the provided article Id.");
      }

      return res.sendSuccess(article, "Success");
    } catch (error) {
      return res.sendError(error);
    }
  }
}
