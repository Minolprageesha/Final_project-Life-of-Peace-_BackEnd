import * as mongoose from "mongoose";
import { Schema } from "mongoose";

export const WorkingDaysSchema = new mongoose.Schema({
    sunday: {
        type: Schema.Types.Boolean,
        required: true,
        default: false
    },
    monday: {
        type: Schema.Types.Boolean,
        required: true,
        default: false
    },
    tuesday: {
        type: Schema.Types.Boolean,
        required: true,
        default: false
    },
    wednesday: {
        type: Schema.Types.Boolean,
        required: true,
        default: false
    },
    thursday: {
        type: Schema.Types.Boolean,
        required: true,
        default: false
    },
    friday: {
        type: Schema.Types.Boolean,
        required: true,
        default: false
    },
    saturday: {
        type: Schema.Types.Boolean,
        required: true,
        default: false
    },
});