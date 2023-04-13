import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import { IContact } from "../models/contact-us-model";

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

export const ContactSchema = new mongoose.Schema({
    name: {
        type: Schema.Types.String,
        require : true,
    },
    email: {
        type: Schema.Types.String,
        require : true,
    },
    problem: {
        type: Schema.Types.String,
        require : true
    },
    phoneNumber: {
        type: Schema.Types.String,
        require : true
    },
}, schemaOptions);

const Contact = mongoose.model<IContact>('Contact', ContactSchema);

export default Contact;