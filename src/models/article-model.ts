import * as mongoose from "mongoose";
import { Types } from "mongoose";

interface Common {
  articleTitle: string;
  articleBody: string;
  createdBy?: Types.ObjectId;
  uploadId?: Types.ObjectId;
}

export interface DArticle extends Common {}

export interface IArticle extends Common, mongoose.Document {
  _id: Types.ObjectId;
}
