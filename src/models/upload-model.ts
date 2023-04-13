import * as mongoose from "mongoose";
import { Types } from "mongoose";

export interface DUpload {
    userId?: Types.ObjectId;
    type: string;
    path: string;
    originalName?: string;
    name?: string;
    extension?: string;
    isUrl?: boolean;
    notes?: string;
    fileSize?: number;
    category?: string;
    title?: string;
    signRequired?: boolean;
    url?: string;
}

export type IUpload = DUpload & mongoose.Document;
