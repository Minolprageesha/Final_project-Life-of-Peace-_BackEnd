import * as mongoose from "mongoose";
import { Types } from "mongoose";
import { DTherapist } from "./therapist-model";

export enum FriendRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

interface Common {
  clientId?: Types.ObjectId;
  therapistId?: Types.ObjectId;
  status: string;
}

export interface DFriendRequest extends Common {}

export interface IFriendRequest extends Common, mongoose.Document {
  _id: Types.ObjectId;
}
