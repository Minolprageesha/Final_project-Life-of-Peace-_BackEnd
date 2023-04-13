import { AppLogger } from "../common/logging";
import { DAdmin, IAdmin } from "../models/admin-model";
import Admin from "../schemas/admin-schema";
import { UserDao } from "./user-dao";
import { DUser, IUser, UserRole } from "../models/user-model";
import ExperienceTag from "../schemas/experience-tag-schema";
import { StringOrObjectId } from "../common/util";
import Client from "../schemas/client-schema";
import { ITherapist } from "../models/therapist-model";
import Therapist from "../schemas/therapist-schema";
import { Types } from "mongoose";
import { DExperienceTag, IExperienceTag } from "../models/experience-tag-model";
import { IClient } from "../models/client-model";
import User from "../schemas/user-schema";

export namespace AdminDao {
    const populateOptions = ["coverPhoto", "profilePhoto"];

    export async function getExperienceTag(
        expTag: string
    ): Promise<IExperienceTag> {
        const experienceTag = await ExperienceTag.findOne({
            experienceTag: { $regex: `^${expTag}`, $options: "i" },
        });
        return experienceTag;
    }

    export async function addExperienceTag(
        expTag: string
    ): Promise<IExperienceTag> {
        const iExperienceTag = new ExperienceTag({ experienceTag: expTag });
        let experienceTag = await iExperienceTag.save();
        AppLogger.info(`Created exp tag. ID: ${experienceTag._id}`);
        return experienceTag;
    }

    export async function getAllExperienceTags(limit?: number, offset?: number): Promise<IExperienceTag[]> {
        const expTagList = await ExperienceTag.find().sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit);
        return expTagList;
    }

    export async function getExperienceTagById(
        id: StringOrObjectId
    ): Promise<IExperienceTag> {
        const expTag = await ExperienceTag.findById(id);
        return expTag;
    }

    export async function deleteExperienceTag(
        id: StringOrObjectId
    ): Promise<IExperienceTag> {
        const response = await ExperienceTag.findByIdAndDelete(id);

        return response;
    }

    export async function getExperienceTagsByName(
        expTag: string
    ): Promise<IExperienceTag> {
        const response = await ExperienceTag.findOne({
            experienceTag: { $regex: `^${expTag}`, $options: "i" },
        });
        return response;
    }


    export async function updateExperienceTag(
        id: StringOrObjectId,
        data: Partial<DExperienceTag>
    ): Promise<IExperienceTag> {
        const updatedTag = await ExperienceTag.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true }
        );
        return updatedTag;
    }


    export async function getAllPendingClients(limit?: number, offset?: number): Promise<IClient[]> {
        const clientList = await Client.find({ adminApproved: false }).sort({ createdAt: -1 }).skip(offset).limit(limit);
        return clientList;
    }

    export async function getAllApprovedClients(limit?: number, offset?: number): Promise<IClient[]> {
        const clientList = await Client.find({ adminApproved: true }).skip(offset).limit(limit);
        return clientList;
    }

    export async function approveRejectClient(
        clientId: Types.ObjectId,
        status: string
    ): Promise<IClient> {
        const client = await Client.findByIdAndUpdate(
            clientId,
            { adminApproved: Boolean(status) },
            { new: true }
        );

        AppLogger.info(`Update client for client Id: ${clientId}`);
        return client;
    }

    export async function getAllPendingTherapists(
        limit?: number,
        offset?: number
    ): Promise<ITherapist[]> {
        const therapistList = await Therapist.find({ adminApproved: false }).sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit);
        return therapistList;
    }

    export async function getAllApprovedTherapists(
        limit?: number,
        offset?: number
    ): Promise<ITherapist[]> {
        const therapistList = await Therapist.find({ adminApproved: true }).sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit);
        return therapistList;
    }

    export async function approveRejectTherapist(
        therapistId: Types.ObjectId,
        status: string
    ): Promise<ITherapist> {
        const therapist = await Therapist.findByIdAndUpdate(
            therapistId,
            { adminApproved: Boolean(status) },
            { new: true }
        );

        AppLogger.info(`Update therapist for therapist Id: ${therapistId}`);
        return therapist;
    }

    export async function getAllClients(
        limit?: number,
        offset?: number
    ): Promise<IClient[]> {
        if (limit == -1) {
            const clientsList = await Client.find({}, { email: 1 });

            return clientsList;
        } else {
            const clientsList = await Client.find()
                .sort({ createdAt: -1 })
                .skip(limit * (offset - 1))
                .limit(limit);

            return clientsList;
        }
    }

    export async function getAllTherapists(
        limit?: number,
        offset?: number
    ): Promise<ITherapist[]> {
        const therapistList = await Therapist.find()
            .sort({ createdAt: -1 })
            .skip(limit * (offset - 1))
            .limit(limit);

        return therapistList;
    }

    export async function getAllClientsCount(): Promise<number | any> {
        const response = await Client.find().countDocuments();
        return response;
    }

    export async function getAllTherapistsCount(): Promise<number | any> {
        const response = await Therapist.find().countDocuments();
        return response;
    }

    export async function searchClientsByAdmin(
        searchableString: string,
        limit: number,
        offset: number,
        role?: UserRole,
        gender?: string,
        status?: string,
        isSubscription?: string,
        zipCode?: string
      ): Promise<IClient[]> {
        const genderQuery = gender != null && gender ? { gender: gender } : {};
        const statusQuery =
          status != null && status ? { verifiedStatus: status } : {};
        const zipCodeQuery = zipCode != null && zipCode ? { zipCode: zipCode } : {};
        const subscriptionQuery =
          isSubscription != null && isSubscription
            ? { subscriptionStatus: isSubscription }
            : {};
    
        let searchedName = null;
    
        if (searchableString) {
          let seacrhItem = searchableString.replace(/\s/g, "");
          searchedName =
            searchableString != null ? new RegExp(`^${seacrhItem}`, "i") : null;
        }
    
        const clientNameQuery =
          searchedName != null && searchedName
            ? {
                $and: [
                  {
                    $or: [
                      { firstname: searchedName },
                      { lastname: searchedName },
                      { email: searchedName },
                      { fullName: searchedName },
                    ],
                  },
                ],
              }
            : {};
    
        let searchResult: IClient[] = await Client.aggregate([
          {
            $project: {
              firstname: 1,
              lastname: 1,
              fullName: {
                $concat: ["$firstname", "$lastname"],
              },
              email: 1,
              createdAt: 1,
              photoId: 1,
              role: 1,
              gender: 1,
              zipCode: 1,
              state: 1,
              verifiedStatus: 1,
              subscriptionId: 1,
              subscriptionStatus: 1,
              lavniTestAccount: 1,
              insuranceId: 1,
              premiumStatus: 1,
              phone: 1,
              _id: 1,
            },
          },
          {
            $match: {
              $and: [
                genderQuery,
                statusQuery,
                subscriptionQuery,
                clientNameQuery,
                zipCodeQuery,
              ],
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
        ]);
    
        return searchResult;
      }

      
      export async function searchTherapists(
        searchableString: string,
        limit: number,
        offset: number,
        gender?: string,
        status?: string,
        isSubscription?: string,
        zipCode?: string
      ): Promise<ITherapist[]> {
        const genderQuery = gender != null && gender ? { gender: gender } : {};
        const statusQuery =
          status != null && status ? { verifiedStatus: status } : {};
        const zipCodeQuery = zipCode != null && zipCode ? { zipCode: zipCode } : {};
        const subscriptionQuery =
          isSubscription != null && isSubscription
            ? { subscriptionStatus: isSubscription }
            : {};
    
        let searchedName = null;
    
        if (searchableString) {
          let seacrhItem = searchableString.replace(/\s/g, "");
          searchedName =
            searchableString != null ? new RegExp(`^${seacrhItem}`, "i") : null;
        }
    
        const clientNameQuery =
          searchedName != null && searchedName
            ? {
                $and: [
                  {
                    $or: [
                      { firstname: searchedName },
                      { lastname: searchedName },
                      { email: searchedName },
                      { fullName: searchedName },
                    ],
                  },
                ],
              }
            : {};
    
        let searchResult: ITherapist[] = await Therapist.aggregate([
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
              gender: 1,
              zipCode: 1,
              state: 1,
              verifiedStatus: 1,
              lavniTestAccount: 1,
              phone: 1,
              _id: 1,
            },
          },
          {
            $match: {
              $and: [
                genderQuery,
                statusQuery,
                subscriptionQuery,
                clientNameQuery,
                zipCodeQuery,
              ],
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
        ]);
    
        return searchResult;
      }

      
      export async function updateUser(
        userId: string,
        data: Partial<DUser>
      ): Promise<IUser> {
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { $set: data },
          { new: true }
        );
        return updatedUser;
      }
    

}