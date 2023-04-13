import * as mongoose from "mongoose";
import { Schema } from "mongoose";

export const VacationSchema = new mongoose.Schema(
  {
    beginDate: {
      type: Schema.Types.String,
      required: false,
    },
    endDate: {
      type: Schema.Types.String,
      required: false,
    },
  },

  { _id: false }
);