import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import { IArticle } from "../models/article-model";
import Upload from "./upload-schema";
import User from "./user-schema";

const schemaOptions: mongoose.SchemaOptions = {
  _id: true,
  id: false,
  timestamps: true,
  skipVersioning: true,
  strict: false,
  toJSON: {
    getters: true,
    virtuals: true,
  },
};

export const ArticleSchema = new mongoose.Schema(
  {
    articleTitle: {
      type: Schema.Types.String,
      require: true,
    },
    articleBody: {
      type: Schema.Types.String,
      require: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      require: true,
      ref: User.modelName,
    },

    uploadId: {
      type: Schema.Types.ObjectId,
      require: false,
      ref: Upload.modelName,
    },
    videoThumbnail: {
      type: Schema.Types.ObjectId,
      ref: Upload.modelName
    },
  },
  schemaOptions
);

const Article = mongoose.model<IArticle>("Article", ArticleSchema);

export default Article;
