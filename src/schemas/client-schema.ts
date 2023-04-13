import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import { IClient } from "../models/client-model";
import { UserRole } from "../models/user-model";
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

export const ClientSchema = new mongoose.Schema(
  {
    dislikedTherapists: [
      {
        type: Schema.Types.ObjectId,
        require: false
      },
    ],
    depressLevel: {
      type: Schema.Types.String,
      required: false
    },
    depressCount: {
      type: Schema.Types.String,
      required: false
    },
    homePhone: {
      type: Schema.Types.String,
      required: false
    },
    workPhone: {
      type: Schema.Types.String,
      required: false
    },
  },
  schemaOptions
);

const Client = User.discriminator<IClient>(
  "Client",
  ClientSchema,
  UserRole.CLIENT
);

export default Client;
