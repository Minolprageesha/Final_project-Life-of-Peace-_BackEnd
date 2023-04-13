import * as mongoose from "mongoose";

interface Common {
    name:string;
    disabled:boolean;
}

export interface DProfession extends Common { }

export interface IProfession extends Common, mongoose.Document {}