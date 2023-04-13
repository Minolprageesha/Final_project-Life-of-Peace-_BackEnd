import { Types } from "mongoose";
import { StringOrObjectId, Util } from "../common/util";
import { IExperienceTag } from "../models/experience-tag-model";
import { IProfession } from "../models/profession-model";
import { Review } from "../models/sub-models/review-model";
import { DTherapist, ITherapist } from "../models/therapist-model";
import ExperienceTag from "../schemas/experience-tag-schema";
import Profession from "../schemas/profession-schema";
import Therapist from "../schemas/therapist-schema";
import { UserDao } from "./user-dao";
import { UserStatus } from "../models/user-model";
import { ClientDao } from "./client-dao";

export namespace TherapistDao {
  export async function getUserById(id: StringOrObjectId): Promise<ITherapist> {
    let user: ITherapist = await Therapist.findById(id);

    return user;
  }


  export async function updateTherapist(
    id: StringOrObjectId,
    data: Partial<DTherapist>
  ): Promise<ITherapist> {
    let therapist = await Therapist.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { new: true }
    )
      .populate([
        { path: "photoId" },
        { path: "experiencedIn" },
        { path: "profession" },
      ])
      .select({ password: 0 });
    return therapist;
  }

  export async function getAllTherapists(
    userId: Types.ObjectId,
    limit: number,
    offset: number
  ): Promise<ITherapist[]> {
    let blockList: Types.ObjectId[] = [];
    const user = await UserDao.getUserByUserId(userId);
    blockList = user.blockedUser;
    let therapistList = await Therapist.find()
      .select({ password: 0 })
      .where("_id")
      .nin(blockList)
      .populate([
        { path: "photoId" },
        { path: "experiencedIn" },
        { path: "profession" },
        {
          path: "licenseId",
          populate: [
            {
              path: "uploadId",
              model: "Upload",
              select: { url: 1, name: 1, title: 1 },
            },
          ],
        },
        {
          path: "qualifications",
          populate: [
            {
              path: "uploadId",
              model: "Upload",
              select: { url: 1, name: 1, title: 1 },
            },
          ],
        },
      ])
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
    return therapistList;
  }

  export async function getAllVerifiedTherapists(): Promise<any[]> {
    let therapistList = await Therapist.find({
      verifiedStatus: UserStatus.VERIFIED,
    })
      .select({
        recentTransaction: 1,
        stripeConnectedAccountId: 1,
        firstname: 1,
        lastname: 1,
      })
      .populate([{ path: "recentTransaction" }]);

    return therapistList;
  }

  export async function searchTherapists(
    userId: Types.ObjectId,
    gender: string,
    experiencedIn: string[],
    searchTherapistName: string,
    dislikedClients: Types.ObjectId[],
    limit: number,
    offset: number
  ): Promise<ITherapist[]> {
    const client = await ClientDao.getUserById(userId);

    const genderQuery = gender != null && gender ? { gender: gender } : {};

    const removeDislikedQuery = { dislikedClients: { $nin: dislikedClients } };

    const removeInvalidTherapistsQuery = {
      blockedByAdmin: { $ne: true },
      adminApproved: { $ne: false },
    };

    let experiencedInObjectArray: Types.ObjectId[] = [];

    if (experiencedIn && experiencedIn != null) {
      for (let eI of experiencedIn) {
        if (Util.isObjectId(eI) && eI !== "") {
          experiencedInObjectArray.push(Types.ObjectId(eI));
        }
      }
    }

    const experiencedInQuery =
      experiencedInObjectArray !== null && experiencedInObjectArray.length !== 0
        ? { experiencedIn: { $in: experiencedInObjectArray } }
        : {};

    let searchedName = null;

    if (searchTherapistName) {
      let seacrhItem = searchTherapistName.replace(/\s/g, "");
      searchedName =
        searchTherapistName != null ? new RegExp(`^${seacrhItem}`, "i") : null;
    }

    const therapistNameQuery =
      searchedName != null && searchedName
        ? {
          $or: [
            { firstname: searchedName },
            { lastname: searchedName },
            { fullName: searchedName },
          ],
        }
        : {};

    // const stateQuery =
    //   client.state !== null && client.state && client.state !== "" ? {
    //     $or: [
    //       { state: client.state },
    //     ],
    //   }
    //     : { state: client.state }

    let searchResults: ITherapist[] = await Therapist.aggregate([
      {
        $project: {
          fullName: {
            $concat: ["$firstname", "$lastname"],
          },
          firstname: 1,
          lastname: 1,
          email: 1,
          createdAt: 1,
          photoId: 1,
          role: 1,
          roleType: 1,
          gender: 1,
          experiencedIn: 1,
          dislikedClients: 1,
          blockedByAdmin: 1,
          adminApproved: 1,
          zipCode: 1,
          state: 1,
          _id: 1,
        },
      },
      {
        $match: {
          $and: [
            therapistNameQuery,
            genderQuery,
            removeDislikedQuery,
            removeInvalidTherapistsQuery,
            experiencedInQuery,
            // stateQuery
          ],
        },
      },
      {
        $lookup: {
          from: "friendrequests",
          localField: "_id",
          foreignField: "therapistId",
          as: "friendRequests",
        },
      },
      {
        $unwind: {
          path: "$friendRequests.clientId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "friendRequests.clientId": { $ne: userId },
        },
      },
      {
        $lookup: {
          from: "uploads",
          localField: "photoId",
          foreignField: "_id",
          pipeline: [
            {
              $project: { isUrl: 1, path: 1, originalName: 1, url: 1 },
            },
          ],
          as: "photoId",
        },
      },

      {
        $lookup: {
          from: "experiencetags",
          localField: "experiencedIn",
          foreignField: "_id",
          pipeline: [
            {
              $project: { experienceTag: 1 },
            },
          ],
          as: "experiencedIn",
        },
      },

      {
        $unwind: {
          path: "$photoId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: offset,
      },
      {
        $limit: limit,
      },
      {
        $sample: { size: 99 },
      },
    ]);

    return searchResults;
  }


  export async function getProfessionById(
    id: StringOrObjectId
  ): Promise<IProfession> {
    const response = await Profession.findById(id);
    return response;
  }

  export async function getProfessionByName(
    professionName: string
  ): Promise<IProfession> {
    const profession = await Profession.findOne({
      name: professionName,
    });

    return profession;
  }

  export async function getExperienceTagById(
    id: StringOrObjectId
  ): Promise<IExperienceTag> {
    const response = await ExperienceTag.findById(id);
    return response;
  }

  export async function addReview(
    therapistId: Types.ObjectId,
    reviewDetails: Review
  ): Promise<ITherapist> {
    let response = await Therapist.findByIdAndUpdate(
      therapistId,
      { $push: { reviews: reviewDetails } },
      { new: true }
    ).populate([
      {
        path: "reviews.client",
        populate: [
          {
            path: "photoId",
            model: "Upload",
          },
        ],
      },
    ]);
    return response;
  }

  export async function viewReviewsByTherapistId(
    therapistId: Types.ObjectId,
    limit?: number,
    offset?: number
  ): Promise<Review[]> {
    let therapist = await Therapist.findById(therapistId).populate({
      path: "reviews.client",
      select: { firstname: 1, lastname: 1, photoId: 1 },
    });
    let populated = await Therapist.populate(therapist, {
      path: "reviews.client.photoId",
    });

    let reviewList: Review[];

    if (populated) {
      reviewList = populated.reviews;
    } else {
      reviewList = [];
    }

    return reviewList;
  }

}
