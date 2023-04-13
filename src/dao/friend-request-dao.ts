import { Types } from "mongoose";
import { StringOrObjectId } from "../common/util";
import {
  DFriendRequest,
  IFriendRequest,
  FriendRequestStatus,
} from "../models/friend-request-model";
import { UserRole } from "../models/user-model";
import FriendRequest from "../schemas/friend-request-schema";

export namespace FriendRequestDao {
  const populateOptions = [
    {
      path: "clientId",
      select: { firstname: 1, lastname: 1, photoId: 1,  email: 1, gender: 1,primaryPhone: 1,  },
      populate: [{ path: "photoId", model: "Upload" }],
    },
    {
      path: "therapistId",
      select: {
        firstname: 1,
        lastname: 1,
        photoId: 1,
        experiencedIn: 1,
        email: 1,
        primaryPhone: 1,
      },
      populate: [{ path: "photoId", model: "Upload" }],
    },
  ];

  export async function getRequestById(
    id: StringOrObjectId
  ): Promise<IFriendRequest> {
    let request: IFriendRequest = await FriendRequest.findById(id).populate(
      populateOptions
    );

    return request;
  }

  export async function updateRequest(
    id: StringOrObjectId,
    data: Partial<DFriendRequest>
  ): Promise<IFriendRequest> {
    let request = await FriendRequest.findByIdAndUpdate(
      { _id: id },
      { $set: data },
      { new: true }
    ).populate(populateOptions);

    return request;
  }

  export async function createRequestByClient(
    requestDetails: DFriendRequest
  ): Promise<IFriendRequest> {
    const iRequest = new FriendRequest(requestDetails);
    let request = await iRequest.save();

    let response = FriendRequestDao.getRequestById(request._id);

    return response;
  }

  // admin 

  export async function getAllFriendsByTherapistIdAdmin(
    therapistId: Types.ObjectId
  ): Promise<IFriendRequest[]> {
    const response = await FriendRequest.find({
      therapistId: therapistId,
      status: FriendRequestStatus.APPROVED
    }).populate(populateOptions);
    return response;
  }

  export async function getAllRequestsByTherapistId(
    therapistId: Types.ObjectId,
    limit: number,
    offset: number
  ): Promise<IFriendRequest[]> {
    // const response = await FriendRequest.find({
    //   therapistId: therapistId,
    // }).where("status").ne(FriendRequestStatus.REJECTED).populate(populateOptions);

    const res = await FriendRequest.aggregate([
      {
        $match: {
          $and: [
            { therapistId: therapistId },
            { status: { $ne: FriendRequestStatus.REJECTED } },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "clientId",
          foreignField: "_id",
          as: "clientId",
        },
      },
      {
        $unwind: {
          path: "$clientId",
        },
      },
      {
        $match: {
          $or: [
            { "clientId.blockedByAdmin": false },
            { "clientId.blockedByAdmin": undefined },
          ],
        },
      },
    ]).skip(limit * (offset - 1))
    .limit(limit);


    const response = FriendRequest.populate(res, populateOptions);

    return response;
  }

  export async function getAllRequestsByClient(
    clientId: Types.ObjectId,
    limit: number,
    offset: number
  ): Promise<IFriendRequest[]> {
    const res = await FriendRequest.aggregate([
      {
        $match: {
          $and: [
            { clientId: clientId },
            { status: { $ne: FriendRequestStatus.REJECTED } },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "therapistId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                experiencedIn: 1,
                photoId: 1,
                adminApproved: 1,
                blockedByAdmin: 1,
                firstname: 1,
                lastname: 1,
                role: 1,
              },
            },
          ],
          as: "therapistId",
        },
      },
      {
        $unwind: {
          path: "$therapistId",
        },
      },
      {
        $match: {
          $or: [
            { "therapistId.blockedByAdmin": false },
            { "therapistId.blockedByAdmin": undefined },
          ],
        },
      },
      {
        $lookup: {
          from: "experiencetags",
          localField: "therapistId.experiencedIn",
          foreignField: "_id",
          pipeline: [
            {
              $project: { experienceTag: 1 },
            },
          ],
          as: "therapistId.experiencedIn",
        },
      },
      {
        $lookup: {
          from: "uploads",
          localField: "therapistId.photoId",
          foreignField: "_id",
          as: "therapistId.photoId",
        },
      },
      {
        $unwind: {
          path: "$therapistId.photoId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sample: { size: 99 },
      },
    ])
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    return res;
  }

  export async function checkIfUserIsFriend(
    clientId: Types.ObjectId,
    therapistId: Types.ObjectId
  ): Promise<IFriendRequest> {
    const response = await FriendRequest.findOne({
      clientId: clientId,
      therapistId: therapistId,
      status: FriendRequestStatus.APPROVED,
    }).populate(populateOptions);

    return response;
  }

  export async function getAllRequestsByClientId(
    clientId: StringOrObjectId
  ): Promise<IFriendRequest[]> {
    const response = await FriendRequest.find({
      clientId: clientId,
    })
      .where("status")
      .ne(FriendRequestStatus.REJECTED)
      .populate(populateOptions);

    return response;
  }

  export async function deleteRequestById(
    id: StringOrObjectId
  ): Promise<IFriendRequest> {
    const response = await FriendRequest.findByIdAndDelete(id).populate(
      populateOptions
    );
    return response;
  }

  export async function getRequestByIdAndUserId(
    requestId: StringOrObjectId,
    userId: StringOrObjectId,
    role: UserRole
  ): Promise<IFriendRequest> {
    let request: IFriendRequest = null;
    if (role == UserRole.THERAPIST) {
      request = await FriendRequest.findOne({
        _id: requestId,
        therapistId: userId,
      }).populate(populateOptions);
    }

    if (role == UserRole.CLIENT) {
      request = await FriendRequest.findOne({
        _id: requestId,
        clientId: userId,
      }).populate(populateOptions);
    }

    return request;
  }

  export async function deleteAllRequestsByClientId(
    clientId: StringOrObjectId
  ): Promise<number> {
    const response = await FriendRequest.deleteMany({
      clientId: clientId,
    });

    return response.ok;
  }

  export async function deleteAllRequestsByTherapistId(
    therapistId: StringOrObjectId
  ): Promise<number> {
    const response = await FriendRequest.deleteMany({
      therapistId: therapistId,
    });

    return response.ok;
  }

  export async function getFriendRequestByTherapistIdAndClientId(
    clientId: Types.ObjectId,
    therapistId: Types.ObjectId
  ): Promise<IFriendRequest[]> {
    const response = await FriendRequest.find({
      clientId: clientId,
      therapistId: therapistId,
    });
    return response;
  }
}
