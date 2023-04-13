import * as mongoose from "mongoose";
import { Types } from "mongoose";
import { Review } from "./sub-models/review-model";
import { Vacation } from "./sub-models/vacation-model";
import { WorkingHour } from "./sub-models/working-hours-model";
import { DUser, IUser } from "./user-model";

interface Common {
  licenseId?: Types.ObjectId[];
  qualificationId?: Types.ObjectId[];
  profession?: Types.ObjectId;
  dislikedClients?: Types.ObjectId[];
  experiencedIn?: Types.ObjectId[];
  workingHours?: WorkingHour[];
  license?: string;
  qualifications?: Types.ObjectId[];
  vacation?: Vacation;
  isAvailable?: boolean;
  yearsOfExperience?: number;
  reviews?: Review[];
  roleType?: string;
}

export interface DTherapist extends Common, DUser { }

export interface ITherapist extends Common, IUser, mongoose.Document { }
