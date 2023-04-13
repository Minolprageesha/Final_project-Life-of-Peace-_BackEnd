import * as mongoose from "mongoose";
import { Schema } from "mongoose";

export const WorkingHourSchema = new mongoose.Schema(
  {
    day: {
      type: Schema.Types.String,
      required: false,
    },
    beginTime: {
      type: Schema.Types.String,
      required: false,
    },
    endTime: {
      type: Schema.Types.String,
      required: false,
    },
  },

  { _id: false }
);
