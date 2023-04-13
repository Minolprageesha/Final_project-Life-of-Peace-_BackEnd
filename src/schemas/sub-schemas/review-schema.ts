import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import User from "../user-schema";

export const ReviewSchema = new mongoose.Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: User.modelName,
    },
    stars: {
      type: Schema.Types.Number,
      required: false,
    },
    text: {
      type: Schema.Types.String,
      required: false,
    },
    createdAt: {
      type: Schema.Types.Date,
      required: false,
    },
  },

  { _id: false }
);
