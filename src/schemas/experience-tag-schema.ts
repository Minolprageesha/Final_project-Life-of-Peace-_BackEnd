import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import { IExperienceTag } from "../models/experience-tag-model";

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
export const ExperienceTagSchema = new mongoose.Schema({
    experienceTag: {
        type: Schema.Types.String,
        require : true,
    },    
}, schemaOptions);

const ExperienceTag = mongoose.model<IExperienceTag>('ExperienceTag', ExperienceTagSchema);

export default ExperienceTag;