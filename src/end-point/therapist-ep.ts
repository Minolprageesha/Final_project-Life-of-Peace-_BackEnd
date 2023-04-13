import { NextFunction, Request, Response } from "express";
import { check, validationResult } from "express-validator";
import { Types } from "mongoose";
import { Review } from "../models/sub-models/review-model";
import { UserRole } from "../models/user-model";
let mongoose = require("mongoose");
import fetch from "node-fetch";
import { TherapistDao } from "../dao/therapist-dao";
import { DClient } from "../models/client-model";

export namespace TherapistEp {
  export function updateTherapistValidationRules() {
    return [
      check("workingHours").isArray().withMessage("Working hours should be an array."),
      check("experiencedIn").isArray().withMessage("experiencedIn must be an array."),
    ];
  }

  export function addReviewValidationRules() {
    return [
      check("therapistId")
        .not()
        .isEmpty()
        .withMessage("Therapist id cannot be empty.")
        .isString()
        .withMessage("Therapist id shoould be a string."),
      check("noOfStars")
        .not()
        .isEmpty()
        .withMessage("No of stars cannot be empty.")
        .isNumeric()
        .withMessage("No of stars can only be a number"),
      check("review").not().isEmpty().withMessage("Review cannot be empty.").isString().withMessage("Review can only be a string."),
    ];
  }

  export function searchClientByParamsValidationRules() {
    return [
      check("gender").isString().withMessage("Gender must be a string value"),
      check("ethnicityId").isString().withMessage("Id must be a string value."),
      check("experiencedIn").isArray().withMessage("Invalid experiencedIn value."),
    ];
  }

  export async function getAllTherapists(req: Request, res: Response, next: NextFunction) {
    const userId = req.user._id;
    const limit = Number(req.params.limit);
    const offset = Number(req.params.offset);

    if (req.user.role === UserRole.CLIENT) {
      try {
        let therapistList = await TherapistDao.getAllTherapists(userId, limit, offset);

        return res.sendSuccess(therapistList, "Success");
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

//   export async function searchTherapists(req: Request, res: Response, next: NextFunction) {
//     const userId = req.user._id;
//     const gender = req.body.gender;
//     const ethnicity = req.body.ethnicity;
//     const profession = req.body.profession;
//     const experiencedIn = req.body.experiencedIn;
//     const searchTherapistName = req.body.searchTherapistName;
//     const limit = Number(req.params.limit);
//     const offset = Number(req.params.offset);

//     if (req.user.role === UserRole.CLIENT) {
//       const client: DClient = req.user as DClient;

//       try {
//         let searchResults = await TherapistDao.searchTherapists(
//           userId,
//           gender,
//           ethnicity,
//           profession,
//           experiencedIn,
//           searchTherapistName,
//           [Types.ObjectId(client._id.toString())],
//           limit,
//           offset
//         );

//         return res.sendSuccess(searchResults, "Success");
//       } catch (error) {
//         return res.sendError(error);
//       }
//     } else {
//       return res.sendError("Invalid user role.");
//     }
//   }

export async function searchTherapists(req: Request, res: Response, next: NextFunction) {
  const userId = req.user._id;
  const gender = req.body.gender;
  const experiencedIn = req.body.experiencedIn;
  const searchTherapistName = req.body.searchTherapistName;
  const limit = Number(req.params.limit);
  const offset = Number(req.params.offset);

  if (req.user.role === UserRole.CLIENT) {
    const client: DClient = req.user as DClient;

    try {
      let searchResults = await TherapistDao.searchTherapists(
        userId,
        gender,
        experiencedIn,
        searchTherapistName,
        [Types.ObjectId(client._id.toString())],
        limit,
        offset
      );

      return res.sendSuccess(searchResults, "Success");
    } catch (error) {
      return res.sendError(error);
    }
  } else {
    return res.sendError("Invalid user role.");
  }
}

  export async function addReview(req: Request, res: Response, next: NextFunction) {
    const userId = req.user._id;
    const role = req.user.role;
    const therapistId = req.body.therapistId;
    const noOfStars = req.body.noOfStars;
    const review = req.body.review;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.sendError(errors.array()[0]["msg"]);
    }

    if (!mongoose.Types.ObjectId.isValid(therapistId)) {
      return res.sendError("Invalid object Id");
    } else {
      try {
        let isFound = await TherapistDao.getUserById(therapistId);

        if (!isFound) {
          return res.sendError("No existing therapist for the provided therapistId.");
        }

        if (role === UserRole.CLIENT) {
          try {
            const reviewDetails: Review = {
              client: userId,
              stars: noOfStars,
              text: review,
              createdAt: new Date(),
            };

            let addedReview = await TherapistDao.addReview(therapistId, reviewDetails);

            return res.sendSuccess(addedReview, "Thank you for your feedback. Your rating has been submitted.");
          } catch (error) {
            return res.sendError(error);
          }
        } else {
          return res.sendError("Invalid user role");
        }
      } catch (error) {
        return res.sendError(error);
      }
    }
  }

  export async function viewReviewsByTherapistId(req: Request, res: Response, next: NextFunction) {
    const role = req.user.role;
    const therapistId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(therapistId)) {
      return res.sendError("Invalid object Id");
    }

    if (role === UserRole.THERAPIST || role === UserRole.CLIENT) {
      try {
        let review = await TherapistDao.viewReviewsByTherapistId(Types.ObjectId(therapistId));

        return res.sendSuccess(review, "Success");
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }


}
