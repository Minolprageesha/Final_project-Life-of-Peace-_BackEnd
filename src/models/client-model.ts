import * as mongoose from "mongoose";
import { DUser, IUser } from "./user-model";


interface Common {
  dislikedTherapists?: mongoose.Types.ObjectId[];
  depressLevel?: string;
  depressCount?: number;
  homePhone?: string;
  workPhone?: string;
}

export interface DClient extends Common, DUser {}

export interface IClient extends Common, IUser, mongoose.Document {}
