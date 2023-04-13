import * as mongoose from "mongoose";
import { Types } from "mongoose";
import { IUser } from "./user-model";

interface Common {
    user:IUser;
    code:string;
    status:string;
    validUntil:Date;
}

export interface DLoginVerification extends Common { }

export interface ILoginVerification extends Common, mongoose.Document { 
    _id:Types.ObjectId
}