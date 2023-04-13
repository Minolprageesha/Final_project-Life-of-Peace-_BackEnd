import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
let mongoose = require("mongoose");
import multer = require("multer");
import path = require("path");
import { AdminDao } from "../dao/admin-dao";
import { UploadDao } from "../dao/upload-dao";
import { UserDao } from "../dao/user-dao";
import { UserRole } from "../models/user-model";
import { check, validationResult } from "express-validator";
import { ReportDao } from "../dao/report-user-dao";
import { ReviewStatus } from "../models/report-user-model";
import { StringOrObjectId } from "../common/util";
import { AdminStatisticsDao } from "../dao/admin-statistics-dao";

var fs = require("fs");
export namespace AdminEp {
    export function addExpTagValidationRules() {
        return [
            check("ethnicity")
                .not()
                .isEmpty()
                .isString()
                .withMessage("Ethnicity is required!")
                .isAlpha("en-US", { ignore: " " })
                .withMessage("Ethnicity can only contain letters."),
        ];
    }

    export function updateExpTagValidationRules() {
        return [
            check("updatedExpTag")
                .not()
                .isEmpty()
                .isString()
                .withMessage("Experience tag is required!")
                .isAlpha("en-US", { ignore: " " })
                .withMessage("Experience tag can only contain letters."),
            check("expId").not().isEmpty().isString().withMessage("Experience tag ID is required!"),
        ];
    }


    export async function addExperienceTags(req: Request, res: Response, next: NextFunction) {
        try {
            const expTag = req.body.expTag;
            try {
                const isFound = await AdminDao.getExperienceTag(expTag.replace(/\s\s+/g, " ").trim());

                if (isFound) {
                    return res.sendError("Tag is already found in the system.");
                }

                const expereinceTag = await AdminDao.addExperienceTag(expTag);

                if (!expereinceTag) {
                    return res.sendError("Something went wrong! Tag could not be created.");
                }
                return res.sendSuccess(expereinceTag, "Tag type created.");
            } catch (error) {
                return res.sendError(error);
            }
        } catch (error) {
            return res.sendError(error);
        }
    }

    export async function updateExperienceTags(req: Request, res: Response, next: NextFunction) {
        const expId = req.body.expId;
        const updatedExpTag = req.body.updatedExpTag;

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.sendError(errors.array()[0]["msg"]);
        }

        try {
            const isIdFound = await AdminDao.getExperienceTagById(expId);

            if (isIdFound) {
                const isNameFound = await AdminDao.getExperienceTagsByName(updatedExpTag.replace(/\s\s+/g, " ").trim());

                if (isNameFound) {
                    return res.sendError("Provided experience tag already exists.");
                } else {
                    const updatedTag = await AdminDao.updateExperienceTag(expId, {
                        experienceTag: updatedExpTag,
                    });

                    return res.sendSuccess(updatedTag, "Successfully updated.");
                }
            } else {
                return res.sendError("Experience tag id not found.");
            }
        } catch (error) {
            return res.sendError(error);
        }
    }

    export async function deleteExperienceTag(req: Request, res: Response, next: NextFunction) {
        const experienceTagId = req.params.deleteExperienceTagId;
        if (req.user.role === UserRole.SUPER_ADMIN) {
            try {
                let experienceTag: any = await AdminDao.getExperienceTagById(experienceTagId);

                if (experienceTag == null) {
                    return res.sendError("No experience tag found for the Id.");
                }

                try {
                    let deletedExperienceTag = await AdminDao.deleteExperienceTag(experienceTagId);

                    return res.sendSuccess(deletedExperienceTag, "Experience Tag deleted.");
                } catch (error) {
                    return res.sendError(error);
                }
            } catch (error) {
                return res.sendError(error);
            }
        } else {
            return res.sendError("Invalid user role.");
        }
    }

    export async function getAllExperienceTags(req: Request, res: Response, next: NextFunction) {
        const limit = req.params.limit;
        const offset = req.params.offset;

        if (req.user.role === UserRole.THERAPIST || req.user.role === UserRole.CLIENT || req.user.role === UserRole.SUPER_ADMIN) {
            try {
                const expTags = await AdminDao.getAllExperienceTags(Number(limit), Number(offset));

                if (expTags.length === 0) {
                    return res.sendError("Something went wrong! Could not load experience tags.");
                }

                return res.sendSuccess(expTags, "Success");
            } catch (error) {
                return res.sendError(error);
            }
        } else {
            return res.sendError("Invalid user role.");
        }
    }


    export async function getAllPendingTherapists(req: Request, res: Response, next: NextFunction) {
        const limit = Number(req.params.limit);
        const offset = Number(req.params.offset);

        if (req.user.role === UserRole.SUPER_ADMIN) {
            try {
                const therapistList = await AdminDao.getAllPendingTherapists(limit, offset);

                return res.sendSuccess(therapistList, "Success");
            } catch (error) {
                return res.sendError(error);
            }
        } else {
            return res.sendError("Invalid user role.");
        }
    }

    export async function getAllApprovedTherapists(req: Request, res: Response, next: NextFunction) {
        const limit = Number(req.params.limit);
        const offset = Number(req.params.offset);

        if (req.user.role === UserRole.SUPER_ADMIN) {
            try {
                const therapistList = await AdminDao.getAllApprovedTherapists(limit, offset);

                return res.sendSuccess(therapistList, "Success");
            } catch (error) {
                return res.sendError(error);
            }
        } else {
            return res.sendError("Invalid user role.");
        }
    }

    export async function approveRejectTherapist(req: Request, res: Response, next: NextFunction) {
        if (req.user.role === UserRole.SUPER_ADMIN) {
            try {
                const therapistId = req.body.userId;
                const status = req.body.status;

                if (!therapistId) {
                    return res.sendError("No userId given.");
                }

                const therapist = await UserDao.getUserById(therapistId);

                if (!therapist || therapist.role !== UserRole.THERAPIST) {
                    return res.sendError("No therapist found with given userId.");
                }

                const updatedTherapist = await AdminDao.approveRejectTherapist(therapist._id, status);

                return res.sendSuccess(updatedTherapist, "Success");
            } catch (error) {
                return res.sendError(error);
            }
        } else {
            return res.sendError("Invalid user role.");
        }
    }


    export async function getAllClients(req: Request, res: Response, next: NextFunction) {
        let limit = 0;
        let offset = 0;
    
        if (req.user.role === UserRole.SUPER_ADMIN) {
          limit = parseInt(req.params.limit);
          offset = parseInt(req.params.offset);
          try {
            const clients = await AdminDao.getAllClients(limit, offset);
            const clientCount = await AdminDao.getAllClientsCount();
            let count = clientCount - limit * offset;
    
            const data = {
              clientSet: clients,
              count: count,
            };
    
            return res.sendSuccess(data, "Success");
          } catch (error) {
            return res.sendError(error);
          }
        } else {
          return res.sendError("Invalid user role.");
        }
      }

      
      export async function getAllTherapists(req: Request, res: Response, next: NextFunction) {
        let limit = 0;
        let offset = 0;
        if (req.user.role === UserRole.SUPER_ADMIN) {
          limit = parseInt(req.params.limit);
          offset = parseInt(req.params.offset);
          try {
            const therapist = await AdminDao.getAllTherapists(limit, offset);
            const therapistCount = await AdminDao.getAllTherapistsCount();
    
            let count = therapistCount - limit * offset;
    
            const data = {
              therapistSet: therapist,
              count: count,
            };
    
            return res.sendSuccess(data, "Success");
          } catch (error) {
            return res.sendError(error);
          }
        } else {
          return res.sendError("Invalid user role.");
        }
      }

      export async function getAllPendingClients(req: Request, res: Response, next: NextFunction) {
        const limit = Number(req.params.limit);
        const offset = Number(req.params.offset);
    
        if (req.user.role === UserRole.SUPER_ADMIN) {
          try {
            const clientList = await AdminDao.getAllPendingClients(limit, offset);
    
            return res.sendSuccess(clientList, "Success");
          } catch (error) {
            return res.sendError(error);
          }
        } else {
          return res.sendError("Invalid user role.");
        }
      }
    
      export async function getAllApprovedClients(req: Request, res: Response, next: NextFunction) {
        const limit = Number(req.params.limit);
        const offset = Number(req.params.offset);
    
        if (req.user.role === UserRole.SUPER_ADMIN) {
          try {
            const clientList = await AdminDao.getAllApprovedClients(limit, offset);
    
            return res.sendSuccess(clientList, "Success");
          } catch (error) {
            return res.sendError(error);
          }
        } else {
          return res.sendError("Invalid user role.");
        }
      }
    
      export async function approveRejectClient(req: Request, res: Response, next: NextFunction) {
        if (req.user.role === UserRole.SUPER_ADMIN) {
          try {
            const clientId = req.body.userId;
            const status = req.body.status;
    
            if (!clientId) {
              return res.sendError("No userId given.");
            }
    
            const client = await UserDao.getUserById(clientId);
    
            if (!client || client.role !== UserRole.CLIENT) {
              return res.sendError("No client found with given userId.");
            }
    
            const updatedClient = await AdminDao.approveRejectClient(client._id, status);
    
            return res.sendSuccess(updatedClient, "Success");
          } catch (error) {
            return res.sendError(error);
          }
        } else {
          return res.sendError("Invalid user role.");
        }
      }

      export async function searchClientsByAdmin(req: Request, res: Response, next: NextFunction) {
        const limit = Number(req.params.limit);
        const offset = Number(req.params.offset);
        const searchableString = req.body.searchableString;
        const gender = req.body.gender;
        const status = req.body.status;
        const isSubscription = req.body.isSubscription;
        const zipCode = req.body.zipCode;
        let userRole = req.body.role;
    
        const errors = validationResult(req);
    
        if (!errors.isEmpty()) {
          return res.sendError(errors.array()[0]["msg"]);
        }
    
        if (req.user.role === UserRole.SUPER_ADMIN ) {
          try {
            const result = await AdminDao.searchClientsByAdmin(
              searchableString,
              limit,
              offset,
              userRole,
              gender,
              status,
              isSubscription,
              zipCode
            );
    
            const countUser = await AdminDao.getAllClientsCount();
    
            const count = countUser - limit * offset;
    
            const data = {
              userSet: result,
              count: count,
            };
    
            return res.sendSuccess(data, "Success");
          } catch (error) {
            return res.sendError(error);
          }
        } else {
          return res.sendError("No permission to access!");
        }
      }

      
      export async function searchTherapistsByAdmin(req: Request, res: Response, next: NextFunction) {
        const limit = Number(req.params.limit);
        const offset = Number(req.params.offset);
        const searchableString = req.body.searchableString;
        const gender = req.body.gender;
        const status = req.body.status;
        const isSubscription = req.body.isSubscription;
        const zipCode = req.body.zipCode;
    
        const errors = validationResult(req);
    
        if (!errors.isEmpty()) {
          return res.sendError(errors.array()[0]["msg"]);
        }
    
        if (req.user.role === UserRole.SUPER_ADMIN) {
          try {
            const result = await AdminDao.searchTherapists(searchableString, limit, offset, gender, status, isSubscription, zipCode);
    
            const countUser = await AdminDao.getAllTherapistsCount();
    
            const count = countUser - limit * offset;
    
            const data = {
              userSet: result,
              count: count,
            };
    
            return res.sendSuccess(data, "Success");
          } catch (error) {
            return res.sendError(error);
          }
        } else {
          return res.sendError("No permission to access!");
        }
      }


      
  export async function blockUserByAdmin(req: Request, res: Response, next: NextFunction) {
    const role = req.user.role;
    const userId = req.body.userId;
    const reportId = req.body.reportId;

    if (role === UserRole.SUPER_ADMIN) {
      try {
        let updatedUser = await AdminDao.updateUser(userId, {
          blockedByAdmin: true,
        });

        if (reportId) {
          if (updatedUser) {
            await ReportDao.updateReport(reportId, {
              status: ReviewStatus.BLOCKED,
            });

            return res.sendSuccess("User blocked!", "Success");
          } else {
            return res.sendError("Error while blocking the user.");
          }
        }

        // await EmailService.userStatusHasChanged(
        //   "Sorry to inform you that your Lavni account is blocked.",
        //   updatedUser.email,
        //   updatedUser.firstname,
        //   "blocked"
        // );

        return res.sendSuccess("User blocked!", "Success");
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

  export async function unblockUserByAdmin(req: Request, res: Response, next: NextFunction) {
    const role = req.user.role;
    const userId = req.body.userId;
    const reportId = req.body.reportId;

    if (role === UserRole.SUPER_ADMIN) {
      try {
        let updatedUser = await AdminDao.updateUser(userId, {
          blockedByAdmin: false,
        });

        if (reportId) {
          if (updatedUser) {
            let updatedReview = await ReportDao.updateReport(reportId, {
              status: ReviewStatus.UNBLOCKED,
            });

            return res.sendSuccess(updatedReview, "Success");
          } else {
            return res.sendError("Error while blocking the user.");
          }
        }

        // await EmailService.userStatusHasChanged("Your Lavni account is unblocked.", updatedUser.email, updatedUser.firstname, "unblocked");

        // await SMSService.sendEventSMS(`Hi ${updatedUser.firstname}! Your Lavni account is unblocked.`, updatedUser.primaryPhone);

        return res.sendSuccess("User unblocked!", "Success");
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

  export async function deleteUser(req: Request, res: Response, next: NextFunction) {
    const role = req.user.role;
    const userId = req.params.userId;
    async function deleteUploads(uploadId: StringOrObjectId) {
      let isDeleted = false;
      let resultHandler = async function (error: any) {
        if (error) {
          console.log("Unlink failed.", error);
        } else {
          console.log("File deleted.");
        }
      };

      try {
        let oldPhoto = await UploadDao.getUpload(uploadId.toString());
        await fs.unlink(oldPhoto.path, resultHandler);
        await UploadDao.deleteUploadById(uploadId);
        isDeleted = true;
      } catch (error) {
        isDeleted = false;
      }

      return isDeleted;
    }

    if (role === UserRole.SUPER_ADMIN) {
      try {
        const user = await UserDao.getUserByUserId(userId);

        if (user) {
          if (user.role === "CLIENT") {
            await UserDao.deleteUserById(userId, deleteUploads);
          } else {
            await UserDao.deleteUserById(userId, deleteUploads);
          }
        } else {
          return res.sendError("User does not exist!");
        }

        return res.sendSuccess("User deleted!", "Success");
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role!");
    }
  }

  export async function getTotalUsers(req: Request, res: Response, next: NextFunction) {
    const role = req.user.role;

    if (role === UserRole.SUPER_ADMIN) {
      try {
        let clientsCount = await AdminStatisticsDao.getAllClientCount();

        let therapistCount = await AdminStatisticsDao.getAllTherapistCount();

        let pendingClientCount = await AdminStatisticsDao.getAllPendingClientCount();

        let data = {
          clientCount: clientsCount,
          pendingClientCount: pendingClientCount,
          therapistCount: therapistCount,
        };

        return res.sendSuccess(data, "statistics data.");
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("you have not permission");
    }
  }
}