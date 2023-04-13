import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import { IEducation } from "../models/education-model";
import Upload from "./upload-schema";
import User from "./user-schema";

const schemaOptions: mongoose.SchemaOptions = {
  _id: true,
  id: false,
  timestamps: true,
  skipVersioning: true,
  strict: false,
  toJSON: {
    getters: true,
    virtuals: true,
  },
};

export const EducationSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      require: true,
      ref: User.modelName,
    },
    university: {
      type: Schema.Types.String,
      require: true,
    },
    degree: {
      type: Schema.Types.String,
      require: true,
    },
    fieldOfStudy: {
      type: Schema.Types.String,
      require: true,
    },
    startYear: {
      type: Schema.Types.String,
      require: true,
    },
    endYear: {
      type: Schema.Types.String,
    },
    uploadId: [
      {
        type: Schema.Types.ObjectId,
        require: true,
        ref: Upload.modelName,
      },
    ],
    reviewStatus: {
      type: Schema.Types.String,
      require: true,
    },
  },
  schemaOptions
);

const Education = mongoose.model<IEducation>("Education", EducationSchema);

export default Education;
