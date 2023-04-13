import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import {UserRole} from "../models/user-model";
import User, {UserSchemaOptions} from "./user-schema";

import {IAdmin} from "../models/admin-model";

export const adminSchema = new mongoose.Schema({ 
    name: {
        type: Schema.Types.String,
        required: false,
      }
}, UserSchemaOptions);

export const  Admin = User.discriminator<IAdmin>('SuperAdmin', adminSchema, UserRole.SUPER_ADMIN);

export default Admin;
