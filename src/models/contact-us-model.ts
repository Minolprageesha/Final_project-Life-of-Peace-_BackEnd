import * as mongoose from "mongoose";

interface Common {
    name:string;
    email:string;
    problem:string;
    phoneNumber:string;
}

export interface DContact extends Common { }

export interface IContact extends Common, mongoose.Document { }