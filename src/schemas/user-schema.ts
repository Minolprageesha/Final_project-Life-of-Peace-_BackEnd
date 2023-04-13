import * as mongoose from "mongoose";
import {Schema} from "mongoose";
import * as bcrypt from 'bcryptjs';
import {IUser} from "../models/user-model";
import Upload from "./upload-schema";

const jwt = require('jsonwebtoken');

export const UserSchemaOptions: mongoose.SchemaOptions = {
    _id: true,
    id: false,
    timestamps: true,
    skipVersioning: true,
    strict: false,
    discriminatorKey: 'role',
    toJSON: {
        getters: true,
        virtuals: true,
    },
};

export const UserSchema = new mongoose.Schema({
    firstname: {
        type: Schema.Types.String,
        require : true
    },
    lastname: {
        type: Schema.Types.String,
        require : true
    },
    gender: {
        type: Schema.Types.String,
        require : true
    },
    dateOfBirth: {
        type: Schema.Types.Date,
        require : true
    },
    email: {
        type: Schema.Types.String,
        unique: true,
        required: false
    },
    password: {
        type: Schema.Types.String,
        required: false
    },
    role: {
        type: Schema.Types.String,
        required: true
    },
    verifiedStatus: {
        type: Schema.Types.String,
        required: false
    },
    lastLogin: {
        type: Schema.Types.Date,
        required: false
    },
    verificationCode: {
        type: Schema.Types.String,
        required: false
    },
    photoId: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: Upload.modelName
    },
    description: {
        type: Schema.Types.String,
        required: false
    },
    blockedUser : [{
        type:Schema.Types.ObjectId,
        required:false
    }],
    friendRequests : [{
        type:Schema.Types.ObjectId,
        required:false
    }],
    adminApproved: {
        type: Schema.Types.Boolean,
        required: false
    },
    blockedByAdmin: {
        type: Schema.Types.Boolean,
        required: false
    },
    streetAddress: {
        type: Schema.Types.String,
        required: false
    },
    zipCode: {
        type: Schema.Types.String,
        required: false
    },
    state: {
        type: Schema.Types.String,
        required: false
    },
    primaryPhone: {
        type: Schema.Types.String,
        required: false
    },
}, UserSchemaOptions);

UserSchema.pre('save', function (next) {
    const user: any = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    // generate a salt
    // noinspection JSIgnoredPromiseFromCall
    bcrypt.genSalt(10, function (err, salt) {
        if (err) return next(err);
        // hash the password using our new salt
        // noinspection JSIgnoredPromiseFromCall
        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) return next(err);

            user.password = hash;
            next();
        });
    });
});

// @ts-ignore
// UserSchema.methods.createAccessToken = function (this: IUser, expiresIn?:string) {
//     if(expiresIn){
//         return jwt.sign({user_id: this._id}, process.env.JWT_SECRET, {expiresIn});
//     } else {
//         return jwt.sign({user_id: this._id}, process.env.JWT_SECRET);
//     }   
// };

UserSchema.methods.createAccessToken = function (
    expiresIn: string = "2h"
) {
    return jwt.sign({ user_id: this._id }, process.env.JWT_SECRET, {
        expiresIn: expiresIn,
    });
};

UserSchema.methods.comparePassword = function (password: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
        // noinspection JSIgnoredPromiseFromCall
        // @ts-ignore
        bcrypt.compare(password, this.password, function (err, isMatch) {
            if (err) {
                return reject(err); 
            }
            return resolve(isMatch);
        });
    });
};

UserSchema.methods.compareVerificationCode = function (verificationCode: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
        // noinspection JSIgnoredPromiseFromCall
        // @ts-ignore
        bcrypt.compare(verificationCode, this.verificationCode, function (err, isMatch) {
            if (err) {
                return reject(err); 
            }
            
            return resolve(isMatch);
        });
    });
};


const User = mongoose.model<IUser>('User', UserSchema);
export default User;
