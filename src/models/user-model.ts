import * as mongoose from "mongoose";
import { StringOrObjectId } from "../common/util";
import { IFriendRequest } from "./friend-request-model";

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  THERAPIST = "THERAPIST",
  CLIENT = "CLIENT",
}

export enum UserStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
}

export enum Permission { }

interface CommonAttributes {
  firstname?: string;
  lastname?: string;
  email?: string;
  password?: string;
  role?: string;
  lastLogin?: Date;
  photoId?: mongoose.Types.ObjectId;
  verifiedStatus?: string;
  description?: string;
  blockedUser?: mongoose.Types.ObjectId[];
  friendRequests?: IFriendRequest[];
  loginVerification?: string;
  verificationCode?: string;
  socketId?: string;
  adminApproved?: boolean;
  username?: string;
  gender?: string;
  dateOfBirth?: Date;
  blockedByAdmin?: boolean;
  streetAddress?: string;
  city?: string;
  zipCode?: string;
  state?: string;
  primaryPhone?: string;
}

export interface DUser extends CommonAttributes {
  _id?: StringOrObjectId;
}

export interface IUser extends CommonAttributes, mongoose.Document {
  readonly role: UserRole;

  lastLogin: Date;

  createAccessToken(): string;

  comparePassword(password: string): Promise<boolean>;

  compareVerificationCode(verificationCode: string): Promise<boolean>;
}
