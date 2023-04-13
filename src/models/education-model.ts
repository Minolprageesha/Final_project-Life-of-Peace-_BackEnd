import * as mongoose from "mongoose";
import { StringOrObjectId } from "../common/util";

interface Common {
    university:string;
    degree:string;
    fieldOfStudy:string;
    startYear:string;
    endYear:string;
    uploadId?: any;
    reviewStatus?: string;
}

export interface DEducation extends Common { }

export interface IEducation extends Common, mongoose.Document {   
    userId: StringOrObjectId;
 }