import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import { IProfession } from "../models/profession-model";
import { IReport } from "../models/report-user-model";
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

export const ReportSchema = new mongoose.Schema(
  {
    reported: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: User.modelName,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: User.modelName,
    },
    reason: {
      type: Schema.Types.String,
      required: true,
    },
  },
  schemaOptions
);

const Report = mongoose.model<IReport>(
  "Report",
  ReportSchema
);

export default Report;
