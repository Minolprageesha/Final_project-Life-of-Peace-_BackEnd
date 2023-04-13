import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import { ITherapist } from "../models/therapist-model";
import { UserRole } from "../models/user-model";
import Education from "./education-schema";
import ExperienceTag from "./experience-tag-schema";
import License from "./license-schema";
import Profession from "./profession-schema";
import { ReviewSchema } from "./sub-schemas/review-schema";
import { WorkingHourSchema } from "./sub-schemas/working-hour";
import Upload from "./upload-schema";
import User from "./user-schema";
import { VacationSchema } from "./sub-schemas/vacation.schema";

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

export const TherapistSchema = new mongoose.Schema(
  {
    experiencedIn: [
      {
        type: Schema.Types.ObjectId,
        required: true,
        ref: ExperienceTag.modelName,
      },
    ],
    licenseId: [
      {
        type: Schema.Types.ObjectId,
        required: true,
        ref: License.modelName,
      },
    ],
    qualificationId: [
      {
        type: Schema.Types.ObjectId,
        required: true,
        ref: Education.modelName,
      },
    ],
    profession: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: Profession.modelName,
    },
    loginVerification: {
      type: Schema.Types.String,
      required: false,
    },
    dislikedClients: [
      {
        type: Schema.Types.ObjectId,
        require: false,
      },
    ],
    workingHours: [
      {
        type: WorkingHourSchema,
      },
    ],
    vacation: {
      type: VacationSchema,
    },
    isAvailable: {
      type: Schema.Types.Boolean,
      required: false,
    },
    yearsOfExperience: {
      type: Schema.Types.Number,
      required: false,
    },
    roleType: {
      type: Schema.Types.String,
      required: true
    },
    reviews: [
      {
        type: ReviewSchema,
      },
    ],
  },
  schemaOptions
);

const Therapist = User.discriminator<ITherapist>("Therapist", TherapistSchema, UserRole.THERAPIST);

TherapistSchema.virtual("recentTransaction", {
  ref: "Transaction",
  localField: "_id",
  foreignField: "therapistId",
  justOne: true,
  options: { sort: { createdAt: -1 }, limit: 1 },
});

export default Therapist;
