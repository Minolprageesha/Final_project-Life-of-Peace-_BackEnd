import * as mongoose from "mongoose";
import { Types } from "mongoose";

import { DUser, IUser } from "./user-model";

interface Common {
    name?:string;
}

export interface DAdmin extends Common, DUser {}

export interface IAdmin extends Common, IUser, mongoose.Document {}


