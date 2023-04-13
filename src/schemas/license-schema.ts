import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import { ILicense } from "../models/license-model";
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

export const LicenseSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      require: true,
      ref:User.modelName,
    },
    title: {
      type: Schema.Types.String,
      require: true,
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

const License = mongoose.model<ILicense>("License", LicenseSchema);

export default License;
