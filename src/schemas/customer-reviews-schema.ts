import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import { ICustomerReview } from "../models/customer-reviews-model";

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

export const CustomerReviewsSchema = new mongoose.Schema({
    name: {
        type: Schema.Types.String,
        require: true,
    },
    review: {
        type: Schema.Types.String,
        require: true
    },
    stars: {
        type: Schema.Types.Number,
        required: false,
    },
    createdAt: {
        type: Schema.Types.Date,
        required: false,
    },
}, schemaOptions);

const CustomerReview = mongoose.model<ICustomerReview>('CustomerReviews', CustomerReviewsSchema);

export default CustomerReview;