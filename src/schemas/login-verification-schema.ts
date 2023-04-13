import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import { ILoginVerification } from "../models/login-verification-model";
import { UserSchema } from "./user-schema";

const schemaOptions: mongoose.SchemaOptions = {
    _id: true,
    id: false,
    timestamps: true,
    skipVersioning: true,
    strict: false,
    toJSON: {
        getters: true,
        virtuals: true,
    }
};

export const LoginVerificationSchema = new mongoose.Schema({
    user: {
        type: UserSchema,
        require : true,
    },    
    code: {
        type: Schema.Types.String,
        require : true,
    },    
    status: {
        type: Schema.Types.String,
        require : true,
    }, 
    validUntil: {
        type: Schema.Types.Date,
        require : true,
    },     
}, schemaOptions);

const LoginVerification = mongoose.model<ILoginVerification>('LoginVerification', LoginVerificationSchema);

export default LoginVerification;