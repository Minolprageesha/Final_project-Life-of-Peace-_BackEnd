import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import { IFriendRequest } from "../models/friend-request-model";
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

export const FriendRequestSchema = new mongoose.Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      require: true,
      ref: User.modelName,
    },
    therapistId: {
      type: Schema.Types.ObjectId,
      require: true,
      ref: User.modelName,
    },
    status: {
      type: Schema.Types.String,
      require: true,
    },
  },
  schemaOptions
);

const FriendRequest = mongoose.model<IFriendRequest>("FriendRequest", FriendRequestSchema);

export default FriendRequest;
