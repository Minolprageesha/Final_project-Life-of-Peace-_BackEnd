import * as mongoose from "mongoose";

interface Common {
    name:string;
    review:string;
    stars:number;
    createdAt?: Date;
}

export interface DCustomerReview extends Common { }

export interface ICustomerReview extends Common, mongoose.Document { }