import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import { IUpload } from "../models/upload-model";

const schemaOptions: mongoose.SchemaOptions = {
  _id: true,
  id: false,
  timestamps: true,
  skipVersioning: true,
  strict: false,
  toJSON: {
    getters: true,
    virtuals: true,
    transform: (doc: any, ret: any) => {
      delete ret.path;
      delete ret.isUrl;
    },
  },
};

const uploadSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    type: {
      type: Schema.Types.String,
      required: true,
    },
    path: {
      type: Schema.Types.String,
    },
    name: {
      type: Schema.Types.String,
      required: false,
    },
    originalName: {
      type: Schema.Types.String,
      required: false,
    },
    extension: {
      type: Schema.Types.String,
      required: false,
    },
    isUrl: {
      type: Schema.Types.Boolean,
      required: true,
      default: false,
    },
    notes: {
      type: Schema.Types.String,
      required: false,
    },
    fileSize: {
      type: Schema.Types.Number,
      required: false,
    },
    category: {
      type: Schema.Types.String,
    },
    title: {
      type: Schema.Types.String,
    },
    signRequired: {
      type: Schema.Types.Boolean,
      default: false,
    },
  },
  schemaOptions
);

uploadSchema.virtual("url").get(function () {
  // return this.isUrl ? this.path : process.env.FILE_ACCESS_URL + "/" + this._id;
  return this.isUrl
    ? this.path
    : this.category && this.category === "CALL_RECORDS"
    ? process.env.API + process.env.AUTH_FILE_ACCESS_URL + "/" + this._id + "/" + this.originalName
    : process.env.API + process.env.FILE_ACCESS_URL + "/" + this._id + "/" + this.originalName;
});

uploadSchema.set("toObject", { virtuals: true });
uploadSchema.set("toJSON", { virtuals: true });

const Upload = mongoose.model<IUpload>("Upload", uploadSchema);
export default Upload;
