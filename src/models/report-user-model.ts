import * as mongoose from "mongoose";
import { Types } from "mongoose";

export enum ReviewStatus {
  BLOCKED = "BLOCKED",
  PENDING = "PENDING",
  UNBLOCKED = "UNBLOCKED",
  APPROVED ="APPROVED"
}

interface Common {
  reported: Types.ObjectId;
  reportedBy: Types.ObjectId;
  reason: string;
  status:string;
}

export interface DReport extends Common {}

export interface IReport extends Common, mongoose.Document {
  _id: Types.ObjectId;
}
