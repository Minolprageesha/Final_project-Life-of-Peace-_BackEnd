var mongoose = require("mongoose");
import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { FriendRequestDao } from "../dao/friend-request-dao";
import { UserDao } from "../dao/user-dao";
import { DFriendRequest, FriendRequestStatus, IFriendRequest } from "../models/friend-request-model";
import { UserRole } from "../models/user-model";
import fetch from "node-fetch";
import { ClientDao } from "../dao/client-dao";
import { DClient } from "../models/client-model";
import { TherapistDao } from "../dao/therapist-dao";
import { DTherapist } from "../models/therapist-model";
import { EmailService } from "../mail/config";

export namespace FriendRequestEp {
  export async function createRequestByClient(req: Request, res: Response, next: NextFunction) {
    const clientId = req.user._id;
    const role = req.user.role;
    const therapistId = Types.ObjectId(req.params.therapistId);

    if (role === UserRole.CLIENT) {
      try {
        const therapist = TherapistDao.getUserById(therapistId);

        if (!therapist) {
          return res.sendError("Invalid therapist id.");
        }

        const requestDetails: DFriendRequest = {
          clientId: clientId,
          therapistId: therapistId,
          status: FriendRequestStatus.PENDING,
        };

        let addedFriendRequest = await FriendRequestDao.createRequestByClient(requestDetails);

        if (addedFriendRequest) {
          let updatedTherapist = await UserDao.updateRequestByUserId(therapistId, addedFriendRequest._id);

          let updatedClient = await UserDao.updateRequestByUserId(clientId, addedFriendRequest._id);

          if (updatedTherapist && updatedClient) {
            await EmailService.sendEventEmail(
              updatedTherapist,
              "You have received a new request!",
              "You have received a request from",
              "Click here to connect with the client.",
              updatedClient.firstname + " " + updatedClient.lastname
            );

            return res.sendSuccess(addedFriendRequest, "Request sent.");
          } else {
            return res.sendError("Could not update the users.");
          }
        } else {
          return res.sendError("Failed to send the request.");
        }
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role");
    }
  }
  // export async function createRequestByClient(req: Request, res: Response, next: NextFunction) {
  //   const clientId = req.user._id;
  //   const role = req.user.role;
  //   const therapistId = Types.ObjectId(req.params.therapistId);

  //   if (role === UserRole.CLIENT) {
  //     try {
  //       const therapist = TherapistDao.getUserById(therapistId);

  //       if (!therapist) {
  //         return res.sendError("Invalid therapist id.");
  //       }

  //       const requestDetails: DFriendRequest = {
  //         clientId: clientId,
  //         therapistId: therapistId,
  //         status: FriendRequestStatus.PENDING,
  //       };

  //       let addedFriendRequest = await FriendRequestDao.createRequestByClient(requestDetails);

  //       if (addedFriendRequest) {
  //         let updatedTherapist = await UserDao.updateRequestByUserId(therapistId, addedFriendRequest._id);

  //         let updatedClient = await UserDao.updateRequestByUserId(clientId, addedFriendRequest._id);

  //         let requestDetails: DFriendRequest = {
  //           status: FriendRequestStatus.APPROVED,
  //         };
    
  //         let updatedFriendRequest: any = await FriendRequestDao.updateRequest(addedFriendRequest._id, requestDetails);

  //         if (updatedTherapist && updatedClient && updatedFriendRequest && updatedFriendRequest?.status === FriendRequestStatus.APPROVED ) {

  //           await EmailService.sendEventEmail(
  //             updatedTherapist,
  //             "You have received a new request!",
  //             "You have received a request from",
  //             "Log in to connect with the client.",
  //             updatedClient.firstname + " " + updatedClient.lastname
  //           );

  //           await EmailService.sendEventEmail(
  //             updatedFriendRequest?.clientId,
  //             "You request has been approved!",
  //             "You request has been approved by",
  //             "Log in to connect with the therapist.",
  //             updatedFriendRequest?.therapistId.firstname + " " + updatedFriendRequest?.therapistId.lastname
  //           );
      

  //           return res.sendSuccess(addedFriendRequest, "Request sent.");
            
  //         } else {
  //           return res.sendError("Could not update the users.");
  //         }
  //       } else {
  //         return res.sendError("Failed to send the request.");
  //       }
  //     } catch (error) {
  //       return res.sendError(error);
  //     }
  //   } else {
  //     return res.sendError("Invalid user role");
  //   }
  // }

  export async function updateRequestByTherapist(req: Request, res: Response, next: NextFunction) {
    const role = req.user.role;
    const requestId = req.body.requestId;
    const status = req.body.status;

    if (role != UserRole.THERAPIST) {
      return res.sendError("Invalid user role.");
    }

    try {
      let requestDetails: DFriendRequest = {
        status: status,
      };

      let updatedFriendRequest: any = await FriendRequestDao.updateRequest(requestId, requestDetails);

      if (updatedFriendRequest?.status === FriendRequestStatus.APPROVED) {

        await EmailService.sendEventEmail(
          updatedFriendRequest?.clientId,
          "You request has been approved!",
          "You request has been approved by",
          "Click here to connect with the therapist.",
          updatedFriendRequest?.therapistId.firstname + " " + updatedFriendRequest?.therapistId.lastname
        );


        return res.sendSuccess(updatedFriendRequest, "Request is approved.");
      } else {
        await EmailService.sendEventEmail(
          updatedFriendRequest?.clientId,
          "Your request has been rejected!",
          "Sorry to inform! Your request has been rejected by",
          "Login to view more information.",
          updatedFriendRequest?.therapistId.firstname + " " + updatedFriendRequest?.therapistId.lastname
        );

        return res.sendSuccess(updatedFriendRequest, "Request updated.");
      }
    } catch (error) {
      return res.sendError(error);
    }
  }

  export async function removeFriendRequest(req: Request, res: Response, next: NextFunction) {
    const role = req.user.role;
    const requestId = req.params.requestId;
    let clientFriendRequests: IFriendRequest[] = [];
    let therapistsFriendRequests: IFriendRequest[] = [];

    if (role === UserRole.THERAPIST || role === UserRole.CLIENT ) {
      try {
        let friendRequest: any = await FriendRequestDao.getRequestById(requestId);

        if (!friendRequest) {
          return res.sendError("Invalid request id.");
        }

        let selectedClient = await ClientDao.getUserById(friendRequest.clientId);

        clientFriendRequests = selectedClient.friendRequests;

        if (clientFriendRequests.some((el: any) => el.toString() === friendRequest._id)) {
          let newFriendRequestsList = clientFriendRequests.filter((fR) => fR.toString() !== friendRequest._id.toString());

          const updatedClient: DClient = {
            friendRequests: newFriendRequestsList,
          };

          await UserDao.updateUser(selectedClient._id, updatedClient);
        }

        let selectedTherapist = await TherapistDao.getUserById(friendRequest.therapistId);

        therapistsFriendRequests = selectedTherapist.friendRequests;

        if (therapistsFriendRequests.some((el: any) => el.toString() === friendRequest._id)) {
          let newFriendRequestsList = therapistsFriendRequests.filter((fR) => fR.toString() !== friendRequest._id.toString());

          const updatedTherapist: DTherapist = {
            friendRequests: newFriendRequestsList,
          };

          await UserDao.updateUser(selectedTherapist._id, updatedTherapist);
        }
        await FriendRequestDao.deleteRequestById(friendRequest._id);

        return res.sendSuccess("", "Friend request is successfully removed.");
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

  export async function viewAllRequestsByTherapist(req: Request, res: Response, next: NextFunction) {
    const therapistId = req.user._id;
    const role = req.user.role;
    const limit = Number(req.params.limit);
    const offset = Number(req.params.offset);

    if (role === UserRole.THERAPIST ) {
      try {
        let requestsList = await FriendRequestDao.getAllRequestsByTherapistId(therapistId, limit, offset);

        return res.sendSuccess(requestsList, "Success");
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

  export async function viewAllRequestsByTherapistAdmin(req: Request, res: Response, next: NextFunction) {
    const therapistId = Types.ObjectId(req.params.therapistId);
    const role = req.user.role;

    if (role === UserRole.SUPER_ADMIN) {
      try {
        let requestsList = await FriendRequestDao.getAllFriendsByTherapistIdAdmin(therapistId);
        return res.sendSuccess(requestsList, "Success");
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

  export async function viewAllRequestsByClient(req: Request, res: Response, next: NextFunction) {
    const clientId = req.user._id;
    const role = req.user.role;
    const limit = Number(req.params.limit);
    const offset = Number(req.params.offset);

    if (role === UserRole.CLIENT) {
      try {
        let requestsList = await FriendRequestDao.getAllRequestsByClient(clientId, limit, offset);

        return res.sendSuccess(requestsList, "Success");
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

  export async function checkIfUserIsFriend(req: Request, res: Response) {
    const role = req.user.role;
    const userId = req.params.userId;

    try {
      const user = await UserDao.getUserById(userId);

      if (user) {
        let isFriend;

        if (role == UserRole.CLIENT) {
          isFriend = await FriendRequestDao.checkIfUserIsFriend(req.user._id, user._id);
        } else {
          isFriend = await FriendRequestDao.checkIfUserIsFriend(user._id, req.user._id);
        }

        if (isFriend) {
          return res.sendSuccess(isFriend, "Yes. You have connected with this Therapist.");
        } else {
          return res.sendError("Sorry! You haven't connected with this Therapist yet.");
        }
      } else {
        return res.sendError("Invalid user id.");
      }
    } catch (error) {
      return res.sendError(error);
    }
  }

  export async function checkIfUserIsFriendAdmin(req: Request, res: Response) {
    const role = req.user.role;
    const clientId = Types.ObjectId(req.params.clientId);
    const therapistId = Types.ObjectId(req.params.therapistId);

    try {
      let isFriend;

      if (role == UserRole.SUPER_ADMIN) {
        isFriend = await FriendRequestDao.checkIfUserIsFriend(clientId, therapistId);
      }

      if (isFriend) {
        return res.sendSuccess(isFriend, "Yes. You have connected with this Therapist.");
      } else {
        return res.sendError("Sorry! You haven't connected with this Therapist yet.");
      }
    } catch (error) {
      return res.sendError(error);
    }
  }
  export async function viewAllSentRequestsByClient(req: Request, res: Response, next: NextFunction) {
    const clientId = req.user._id;
    const role = req.user.role;

    if (role === UserRole.CLIENT) {
      try {
        let requestsList = await FriendRequestDao.getAllRequestsByClientId(clientId);

        return res.sendSuccess(requestsList, "Success");
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }



  export async function unfriendUser(req: Request, res: Response, next: NextFunction) {
    const userId = req.user._id;
    const role = req.user.role;
    const requestId = req.params.requestId;

    if (role === UserRole.THERAPIST || role === UserRole.CLIENT ) {
      try {
        let request = await FriendRequestDao.getRequestByIdAndUserId(requestId, userId, role);


        if (!request) {
          return res.sendError("Invalid attempt to unfriend!");
        }

        let deletedRequest: any = await FriendRequestDao.deleteRequestById(requestId);

        if (role == UserRole.CLIENT) {
          EmailService.sendEventEmail(
            deletedRequest.therapistId,
            "You removed from client friend list!",
            "You have removed from friend list By ",
            "Click here to connect",
            deletedRequest.clientId.firstname + " " + deletedRequest.clientId.lastname
          );
        }

        if (role === UserRole.THERAPIST) {
          await EmailService.sendEventEmail(
            deletedRequest.clientId,
            "You removed from therapist friend list!",
            "You have removed from friend list By ",
            "Click here to connect",
            deletedRequest.therapistId.firstname + " " + deletedRequest.therapistId.lastname
          );
        }
        return res.sendSuccess(deletedRequest, "Success");
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role!");
    }
  }

  export async function getFriendRequestByTherapistIdAndClientId(req: Request, res: Response, next: NextFunction) {
    const role = req.user.role;
    const therapistId = req.params.therapistId;
    const clientId = req.params.clientId;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.sendError("Invalid client Id");
    }

    if (!mongoose.Types.ObjectId.isValid(therapistId)) {
      return res.sendError("Invalid therapist Id");
    }

    try {
      let client = await UserDao.getUserById(clientId);
      let therapist = await UserDao.getUserById(therapistId);

      if (!client) {
        return res.sendError("Could not find a client with the given Id.");
      }

      if (!therapist) {
        return res.sendError("Could not find a therapist with the given Id.");
      }

      if (role == UserRole.CLIENT || role == UserRole.THERAPIST) {
        let friendRequest = await FriendRequestDao.getFriendRequestByTherapistIdAndClientId(
          Types.ObjectId(clientId),
          Types.ObjectId(therapistId)
        );

        return res.sendSuccess(friendRequest, "Success");
      } else {
        return res.sendError("Invalid user role!");
      }
    } catch (error) {
      return res.sendError(error);
    }
  }

  export async function viewAllChatList(req: Request, res: Response, next: NextFunction) {
    const clientId = req.user._id;
    const role = req.user.role;

    if (role === UserRole.CLIENT) {
      try {
        let chatList = await FriendRequestDao.getAllApprovdByClient(clientId);

        return res.sendSuccess(chatList, "Success");
      } catch (error) {
        return res.sendError(error);
      }
    } if (role === UserRole.THERAPIST) {
      try {
        let chatList = await FriendRequestDao.getAllApprovedByTherapistId(clientId);

        return res.sendSuccess(chatList, "Success");
      } catch (error) {
        return res.sendError(error);
      }
    }else {
      return res.sendError("Invalid user role.");
    }
  }
}
