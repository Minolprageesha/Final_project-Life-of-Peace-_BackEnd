import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import { IProfession } from "../models/profession-model";

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

export const ProfessionSchema = new mongoose.Schema(
  {
    name: {
      type: Schema.Types.String,
      require: true
    },
    disabled: {
      type: Schema.Types.Boolean,
      require: true
    },
  },
  schemaOptions
);

const Profession = mongoose.model<IProfession>("Profession", ProfessionSchema);

export default Profession;
