import { Types } from "mongoose";

export interface Review {
  _id?: Types.ObjectId;
  client: Types.ObjectId;
  stars: number;
  text: string;
  createdAt?: Date;
}
