import * as mongoose from "mongoose";

interface Common {
  experienceTag: string;
}

export interface DExperienceTag extends Common {}

export interface IExperienceTag extends Common, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}