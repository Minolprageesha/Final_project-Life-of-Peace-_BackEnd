import * as mongoose from "mongoose";

interface Common {
    title:string;
    uploadId?: any;
    reviewStatus?:string;
    userId?:mongoose.Types.ObjectId;
}

export interface DLicense extends Common { }

export interface ILicense extends Common, mongoose.Document {}