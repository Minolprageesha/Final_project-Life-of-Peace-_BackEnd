import { NextFunction, Request, Response } from "express";
import { UserDao } from "../dao/user-dao";
import { Validation } from "../common/validation";
import { check, validationResult } from "express-validator";
import { StringOrObjectId, Util } from "../common/util";
import { DAdmin } from "../models/admin-model";
import { DUser, IUser, UserRole } from "../models/user-model";
import { UserStatus } from "../models/user-model";
import { EmailService } from "../mail/config";
import { DContact } from "../models/contact-us-model";
import { EducationDao } from "../dao/education-dao";
import { LicenseDao } from "../dao/license-dao";
import { DLicense, ILicense } from "../models/license-model";
import { DEducation, IEducation } from "../models/education-model";
import { UploadDao } from "../dao/upload-dao";
import { DUpload, IUpload } from "../models/upload-model";
import multer = require("multer");
import { Types } from "mongoose";
import * as path from "path";
import { DTherapist, ITherapist } from "../models/therapist-model";
import { DClient } from "../models/client-model";
import { DCustomerReview } from "../models/customer-reviews-model";
import { TherapistDao } from "../dao/therapist-dao";
import { AdminDao } from "../dao/admin-dao";
import { ClientDao } from "../dao/client-dao";

let jwt = require("jsonwebtoken");
let mongoose = require("mongoose");
var fs = require("fs");

export enum UploadCategory {
  PROFILE_IMAGE = "PROFILE_IMAGE",
  EDUCATIONAL_DOCUMENTS = "EDUCATIONAL_DOCUMENTS",
  LICENSE_DOCUMENTS = "LICENSE_DOCUMENTS",
  ARTICLE_IMAGE = "ARTICLE_IMAGE",
}

export namespace UserEp {
  export function authenticateValidationRules() {
    return [Validation.email(), Validation.password()];
  }

  export function loginWithEmailValidationRules() {
    return [Validation.email(), Validation.password()];
  }
  export function signUpValidationRules() {
    return [
      check("email")
        .not()
        .isEmpty()
        .withMessage("Email is required.")
        .isEmail()
        .normalizeEmail({ gmail_remove_dots: false })
        .withMessage("Invalid email address and please try again."),
      check("password")
        .isString()
        .not()
        .isEmpty()
        .withMessage("Password is required.")
        .isLength({ min: 6, max: 40 })
        .withMessage(
          "Password must be at least 6 chars long & not more than 40 chars long."
        )
      // .not()
      // .isIn(["123", "password", "god", "abc"])
      // .withMessage("Do not use a common word as the password")
      // .matches(/\d/)
      // .withMessage("Password must contain a number."),
    ];
  }

  export function reviewValidationRules() {
    return [
      check("name")
        .not()
        .isEmpty()
        .withMessage("Name is required.")
        .not()
        .isNumeric()
        .withMessage("Only letters are allowed.")
        .isString()
        .isLength({ max: 100 })
        .withMessage("Name field should not be more than 1000 chars long."),
      check("review")
        .not()
        .isEmpty()
        .withMessage("Review is required.")
        .isString()
        .isLength({ max: 1000 })
        .withMessage("Review field should not be more than 1000 chars long."),
    ];
  }

  export function contactValidationRules() {
    return [
      check("name")
        .not()
        .isEmpty()
        .withMessage("Name is required.")
        .not()
        .isNumeric()
        .withMessage("Only letters are allowed.")
        .isString()
        .isLength({ max: 100 })
        .withMessage("Name field should not be more than 1000 chars long."),
      check("email")
        .not()
        .isEmpty()
        .withMessage("Email is required.")
        .isEmail()
        .normalizeEmail({ gmail_remove_dots: false })
        .withMessage("Invalid email address and please try again."),
      check("problem")
        .not()
        .isEmpty()
        .withMessage("Problem is required.")
        .isString()
        .isLength({ max: 1000 })
        .withMessage("Problem field should not be more than 1000 chars long."),
      check("phoneNumber")
        .not()
        .isEmpty()
        .withMessage("Phone number is required.")
        .isString()
        .isLength({ max: 15 })
        .withMessage("Problem field should not be more than 15 chars long.")
        .isNumeric()
        .withMessage("Phone number can only have digits."),
    ];
  }
  export function forgotPasswordValidationRules() {
    return [Validation.email()];
  }

  export function changePasswordValidationRules() {
    return [
      check("oldPassword")
        .isString()
        .not()
        .isEmpty()
        .withMessage("Password is required.")
        .isLength({ min: 6, max: 40 })
        .withMessage("Password must be at least 6 chars long & not more than 40 chars long.")
        .not()
        .isIn(["123", "password", "god", "abc"])
        .withMessage("Do not use a common word as the password")
        .matches(/\d/)
        .withMessage("Password must contain a number."),
      check("newPassword")
        .isString()
        .not()
        .isEmpty()
        .withMessage("Password is required.")
        .isLength({ min: 6, max: 40 })
        .withMessage("Password must be at least 6 chars long & not more than 40 chars long.")
        .not()
        .isIn(["123", "password", "god", "abc"])
        .withMessage("Do not use a common word as the password")
        .matches(/\d/)
        .withMessage("Password must contain a number."),
      check("confirmPassword")
        .isString()
        .not()
        .isEmpty()
        .withMessage("Password is required.")
        .isLength({ min: 6, max: 40 })
        .withMessage("Password must be at least 6 chars long & not more than 40 chars long.")
        .not()
        .isIn(["123", "password", "god", "abc"])
        .withMessage("Do not use a common word as the password")
        .matches(/\d/)
        .withMessage("Password must contain a number."),
    ];
  }


  export async function getMe(req: Request, res: Response, next: NextFunction) {
    let user = await UserDao.getUserById(req.user._id);

    if (!user) {
      return res.sendError("User not found.");
    }

    return res.sendSuccess(user, "Success");
  }

  export async function signUp(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.sendError(errors.array()[0]["msg"]);
    }

    try {
      const email = req.body.email;
      const primaryPhone = req.body.phone;
      const password = req.body.password;
      const role = req.body.role;
      const roleType = req.body.roleType;
      const verifiedStatus = UserStatus.VERIFIED;

      let user = null;
      let verificationCode = null;

      try {
        let isEmailUsed = await UserDao.getUserByEmail(email);

        if (isEmailUsed) {
          return res.sendError("Provided email is already taken.");
        }

        let isprimaryPhoneUsed = await UserDao.getUserByPrimaryPhone(primaryPhone);

        if (isprimaryPhoneUsed) {
          return res.sendError("Provided primary phone is already taken.");
        }
      } catch (error) {
        return res.sendError(error);
      }

      if (role === UserRole.THERAPIST) {
        user = await UserDao.signUpWithUsers(email, primaryPhone, password, role, roleType, UserStatus.VERIFIED);

        try {
          await EmailService.sendWelcomeEmail(user, "Welcome To Life of Pease");


          await EmailService.sendAdminEmailWhenTherapistSignUp(
            user,
            "New therapist is signed up. Admin approval is required.",
            "New therapist is signed up. Admin approval is required. Therapist Email: ",

          );
        } catch (error) {
          return res.sendError(error);
        }

        return res.sendSuccess(user, "THERAPIST Registered.");
      } else {
        user = await UserDao.signUpWithUsers(email, primaryPhone, password, role, UserStatus.PENDING);
        console.log(user)
        let code = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);

        try {
          verificationCode = code.toString();

          const updatedUser: any = {
            verificationCode: await Util.passwordHashing(verificationCode),
          };

          let userWithVerificationCode = await UserDao.updateUser(user._id, updatedUser);

          if (!userWithVerificationCode) {
            return res.sendError("Something went wrong with verification code.");
          }
        } catch (error) {
          return res.sendError(error);
        }

        let isEmailSent = await EmailService.sendVerifyEmail(
          user,
          "Life of Pease - Verify your email.",
          verificationCode,
          "Thank you for signing up with Life of Pease  !",
          "To proceed with your account you have to verify your email. Please enter the following OTP in the verify section."
        );

        console.log(isEmailSent)


        if (!user) {
          return res.sendError("User signup failed! Please try again later.");
        }

        if (isEmailSent) {
          return res.sendSuccess(user, "Success");
        } else {
          return res.sendError("Email not sent.");
        }
      }
    } catch (error) {
      return res.sendError(error);
    }
  }


  export async function viewUserProfileById(req: Request, res: Response, next: NextFunction) {
    const role = req.user.role;
    const userId = req.params.id;

    if (role === UserRole.CLIENT || role === UserRole.THERAPIST) {
      try {
        let currentUser = await UserDao.getUserByUserId(req.user._id);
        let user = await UserDao.getUserByUserId(userId);

        if (!user) {
          return res.sendError("No user found for the provided user Id.");
        }

        if (user.role === UserRole.THERAPIST) {
          let therapist: ITherapist = user as ITherapist;


          return res.sendSuccess(therapist, "Success");
        }

        return res.sendSuccess(user, "Success");
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

  export async function viewUserProfileByIdAdmin(req: Request, res: Response, next: NextFunction) {
    const role = req.user.role;
    const therapistId = req.params.therapistId;
    const clientId = req.params.clientId;

    if (role === UserRole.SUPER_ADMIN) {
      try {
        let currentUser = await UserDao.getUserByUserId(clientId);
        let user = await UserDao.getUserByUserId(therapistId);


        if (!user) {
          return res.sendError("No user found for the provided user Id.");
        }

        if (user.role === UserRole.THERAPIST) {
          let therapist: ITherapist = user as ITherapist;

          return res.sendSuccess(therapist, "Success");
        }

        return res.sendSuccess(user, "Success");
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

  export async function signUpClient(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.sendError(errors.array()[0]["msg"]);
    }

    try {
      const email = req.body.email;
      const primaryPhone = req.body.phone;
      const password = req.body.password;
      const role = UserRole.CLIENT;
      const depressLevel = req.body.depressLevel;
      const depressCount = req.body.depressCount;
      const gender = req.body.gender;
      const dateOfBirth = req.body.dateOfBirth;
      const verifiedStatus = UserStatus.VERIFIED;

      let user = null;
      let verificationCode = null;

      try {
        let isEmailUsed = await UserDao.getUserByEmail(email);

        if (isEmailUsed) {
          return res.sendError("Provided email is already taken.");
        }

        let isprimaryPhoneUsed = await UserDao.getUserByPrimaryPhone(primaryPhone);

        if (isprimaryPhoneUsed) {
          return res.sendError("Provided primary phone is already taken.");
        }
      } catch (error) {
        return res.sendError(error);
      }

      user = await UserDao.signUpWithClient(email, primaryPhone, password, role, depressLevel, depressCount, gender, dateOfBirth, UserStatus.PENDING);
      console.log(user)
      let code = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);

      try {
        verificationCode = code.toString();

        const updatedUser: any = {
          verificationCode: await Util.passwordHashing(verificationCode),
        };

        let userWithVerificationCode = await UserDao.updateUser(user._id, updatedUser);

        if (!userWithVerificationCode) {
          return res.sendError("Something went wrong with verification code.");
        }
      } catch (error) {
        return res.sendError(error);
      }

      let isEmailSent = await EmailService.sendVerifyEmail(
        user,
        "Life of Pease - Verify your email.",
        verificationCode,
        "Thank you for signing up with Life of Pease  !",
        "To proceed with your account you have to verify your email. Please enter the following OTP in the verify section."
      );

      console.log(isEmailSent)


      if (!user) {
        return res.sendError("User signup failed! Please try again later.");
      }
      return res.sendSuccess(user, "Success");
      if (isEmailSent) {
        return res.sendSuccess(user, "Success");
      } else {
        return res.sendError("Email not sent.");
      }

    } catch (error) {
      return res.sendError(error);
    }
  }

  export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.sendError(errors.array()[0]["msg"]);
    }


    UserDao.authenticateUser(req.body.email, req.body.password)
      .then((token: string) => {
        res.sendSuccess(token, "Token sent successfully.");
      })
      .catch(next);
  }

  export async function loginWithEmail(req: Request, res: Response, next: NextFunction) {
    const email = req.body.email;
    const password = req.body.password;
    const medium = req.body.medium;
    let verificationCode = null;

    const errors = validationResult(req);
    console.log(req.body)
    if (!errors.isEmpty()) {
      return res.sendError(errors.array()[0]["msg"]);
    }
    try {
      let user = await UserDao.getUserByEmail(email);
      console.log(user)
      if (user) {
        if (!user.blockedByAdmin) {
          if (user.verifiedStatus === UserStatus.VERIFIED) {
            let isMatch;

            if (user.password) {
              isMatch = await user.comparePassword(password);
            } else {
              return res.sendError("You have signed up to this account using social login. Please check.");
            }

            if (isMatch) {
              if (user.role === UserRole.CLIENT || user.role === UserRole.THERAPIST) {
                let authToken = user.createAccessToken();

                res.cookie("token", authToken, {
                  httpOnly: true,
                  secure: false,
                  maxAge: 24 * 60 * 60 * 1000,
                });

                return res.sendSuccess(authToken, "Successfully Logged.");
              } else if (user.role === UserRole.SUPER_ADMIN) {
                let authToken = user.createAccessToken();

                res.cookie("token", authToken, {
                  httpOnly: true,
                  secure: false,
                  maxAge: 24 * 60 * 60 * 1000,
                });

                return res.sendSuccess(authToken, "Successfully Logged.");
              } else {
                return res.sendError("Invalid user role");
              }
            } else {
              return res.sendError("Incorrect email/password combination.");
            }
          } else {
            return res.sendError("User not verified.");
          }
        } else {
          return res.sendError(
            "Your account has been suspended. Please reach out to support at info@mylavni.com for further assistance."
          );
        }
      } else {
        return res.sendError("User not found.");
      }
    } catch (error) {
      return res.sendError(error);
    }
  }


  export async function therapistLoginWithEmail(req: Request, res: Response, next: NextFunction) {
    const verificationCode = req.body.verificationCode;
    const role = req.body.role;
    const userId = req.body.userId;

    if (role === UserRole.THERAPIST) {
      try {
        let user = await UserDao.getUserByUserId(userId);

        if (user) {
          if (user.role !== UserRole.CLIENT) {
            if (user.verifiedStatus === UserStatus.VERIFIED) {
              if (user.verificationCode) {
                const isMatch = await user.compareVerificationCode(verificationCode);

                if (isMatch) {
                  const data: any = {
                    loginVerification: UserStatus.VERIFIED,
                  };

                  var isLoginVerified = await UserDao.updateUser(user._id, data);

                  var isVerificationCodeDeleted = await UserDao.unSetField(user._id);

                  if (isLoginVerified && isVerificationCodeDeleted) {
                    const token = user.createAccessToken();

                    res.cookie("token", token, {
                      httpOnly: true,
                      secure: false,
                      maxAge: 24 * 60 * 60 * 1000,
                    });

                    return res.sendSuccess(token, "Success");
                  }
                } else {
                  return res.sendError("Invalid user verification code.");
                }
              } else {
                return res.sendError("Already verified");
              }
            } else {
              return res.sendError("User not verified.");
            }
          } else {
            return res.sendError("Invalid user role");
          }
        } else {
          return res.sendError("User not found");
        }
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role");
    }
  }

  export async function logoutTherapist(req: Request, res: Response, next: NextFunction) {
    const userId = req.user._id;
    const role = req.user.role;

    if (role === UserRole.THERAPIST) {
      try {
        let user = await UserDao.getUserByUserId(userId);

        if (user.loginVerification === UserStatus.VERIFIED) {
          const data: any = {
            loginVerification: UserStatus.PENDING,
          };

          try {
            await UserDao.updateUser(userId, data);
          } catch (error) {
            return res.sendError(error);
          }
        }
      } catch (error) {
        return res.sendError(error);
      }
    }
    res.cookie("token", "", { httpOnly: true, secure: false, maxAge: 10 });
    res.sendSuccess(null, "Successfully logged out.");
  }


  export async function contactUs(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.sendError(errors.array()[0]["msg"]);
      }

      const name = req.body.name;
      const email = req.body.email;
      const problem = req.body.problem;
      const phoneNumber = req.body.phoneNumber;

      const contactRequest: DContact = {
        name: name,
        email: email,
        problem: problem,
        phoneNumber: phoneNumber,
      };

      let response = await UserDao.contactRequest(contactRequest);

      if (response) {
        return res.sendSuccess(response, "Request submitted.");
      } else {
        return res.sendError("Request could not be submitted. Please try again later.");
      }
    } catch (error) {
      return res.sendError(error);
    }
  }


  export async function customerReview(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.sendError(errors.array()[0]["msg"]);
      }

      const name = req.body.name;
      const review = req.body.review;
      const stars = req.body.stars;

      const cusReview: DCustomerReview = {
        name: name,
        review: review,
        stars: stars,
      };

      let response = await UserDao.customerReviewDao(cusReview);

      if (response) {
        return res.sendSuccess(response, "Review added Successfully.");
      } else {
        return res.sendError("Review could not be added. Please try again.");
      }
    } catch (error) {
      return res.sendError(error);
    }
  }

  // export async function therapistLoginWithEmail(req: Request, res: Response, next: NextFunction) {
  //   const verificationCode = req.body.verificationCode;
  //   const role = req.body.role;
  //   const userId = req.body.userId;

  //   if (role === UserRole.THERAPIST) {
  //     try {
  //       let user = await UserDao.getUserByUserId(userId);

  //       if (user) {
  //         if (user.role !== UserRole.CLIENT) {
  //           if (user.verifiedStatus === UserStatus.VERIFIED) {
  //             if (user.verificationCode) {
  //               const isMatch = await user.compareVerificationCode(verificationCode);

  //               if (isMatch) {
  //                 const data: any = {
  //                   loginVerification: UserStatus.VERIFIED,
  //                 };

  //                 var isLoginVerified = await UserDao.updateUser(user._id, data);

  //                 var isVerificationCodeDeleted = await UserDao.unSetField(user._id);

  //                 if (isLoginVerified && isVerificationCodeDeleted) {
  //                   const token = user.createAccessToken();

  //                   res.cookie("token", token, {
  //                     httpOnly: true,
  //                     secure: false,
  //                     maxAge: 24 * 60 * 60 * 1000,
  //                   });

  //                   return res.sendSuccess(token, "Success");
  //                 }
  //               } else {
  //                 return res.sendError("Invalid user verification code.");
  //               }
  //             } else {
  //               return res.sendError("Already verified");
  //             }
  //           } else {
  //             return res.sendError("User not verified.");
  //           }
  //         } else {
  //           return res.sendError("Invalid user role");
  //         }
  //       } else {
  //         return res.sendError("User not found");
  //       }
  //     } catch (error) {
  //       return res.sendError(error);
  //     }
  //   } else {
  //     return res.sendError("Invalid user role");
  //   }
  // }

  // export async function logoutTherapist(req: Request, res: Response, next: NextFunction) {
  //   const userId = req.user._id;
  //   const role = req.user.role;

  //   if (role === UserRole.THERAPIST) {
  //     try {
  //       let user = await UserDao.getUserByUserId(userId);

  //       if (user.loginVerification === UserStatus.VERIFIED) {
  //         const data: any = {
  //           loginVerification: UserStatus.PENDING,
  //         };

  //         try {
  //           await UserDao.updateUser(userId, data);
  //         } catch (error) {
  //           return res.sendError(error);
  //         }
  //       }
  //     } catch (error) {
  //       return res.sendError(error);
  //     }
  //   }
  //   res.cookie("token", "", { httpOnly: true, secure: false, maxAge: 10 });
  //   res.sendSuccess(null, "Successfully logged out.");
  // }


  export async function verifyUserByCode(req: Request, res: Response, next: NextFunction) {
    const verificationCode = req.body.verificationCode;
    const userId = req.body.userId;

    try {
      let user = await UserDao.getUserById(userId);
      let updatedUser = null;

      if (!user.verificationCode) {
        return res.sendError("User is already verified.");
      }

      let isMatch = await user.compareVerificationCode(verificationCode);

      if (isMatch) {
        try {
          const details: any = {
            verifiedStatus: UserStatus.VERIFIED,
          };

          const userDetails = await UserDao.updateUser(userId, details);

          if (!userDetails) {
            return res.sendError("Something went wrong! Please try again later.");
          }

          try {
            updatedUser = await UserDao.unSetField(userId);

            if (!updatedUser) {
              return res.sendError("Verification code could not be removed from the document");
            }
          } catch (error) {
            return res.sendError(error);
          }


          return res.sendSuccess(null, "Successfully verified.");
        } catch (error) {
          return res.sendError(error);
        }
      } else {
        return res.sendError("Invalid verification code.");
      }
    } catch (error) {
      return res.sendError(error);
    }
  }


  export async function sendForgotPasswordMail(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    const email = req.body.email;

    if (!errors.isEmpty()) {
      return res.sendError(errors.array()[0]["msg"]);
    }

    try {
      let existingUser = await UserDao.getUserByEmail(email);

      if (!existingUser) {
        return res.sendError("User not found for the provided email.");
      }

      // let isEmailSent = await EmailService.sendForgetPasswordEmail(existingUser, "Reset Password");

      // if (!isEmailSent) {
      //   return res.sendError("Email not sent.");
      // }

      return res.sendSuccess(null, "Email sent");
    } catch (error) {
      return res.sendError(error);
    }
  }

  export async function resetPassword(req: Request, res: Response, next: NextFunction) {
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const token = req.body.token;
    try {
      let data = null;
      try {
        data = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        return res.sendError(error);
      }

      let existingUser = await UserDao.getUserByEmail(data.email);

      if (!existingUser) {
        return res.sendError("User not found for the provided email.");
      }

      if (password === confirmPassword) {
        const newPassword = await Util.passwordHashing(password);
        const updatedUser: any = {
          password: newPassword,
        };
        let user = await UserDao.updateUser(data._id, updatedUser);
        return res.sendSuccess(null, "Password changed.");
      } else {
        return res.sendError("Password does not match.");
      }
    } catch (error) {
      return res.sendError(error);
    }
  }


  export function logout(req: Request, res: Response) {
    res.cookie("token", "", { httpOnly: true, secure: false, maxAge: 10 });
    res.sendSuccess(null, "Successfully logged out from server!");
  }


  export async function addEducationalInfo(req: Request, res: Response, next: NextFunction) {
    let uploadCategory = UploadCategory.EDUCATIONAL_DOCUMENTS;
    let isValid: boolean = true;
    let uploadedFiles: any[] = [];
    let userId: any = "";

    const storage = multer.diskStorage({
      destination: async (req, FileRes, cb) => {
        await educationalInfoValidationRules(req, cb);
      },
    });

    async function educationalInfoValidationRules(req: any, cb: any) {
      let destination = `${process.env.UPLOAD_PATH}/${uploadCategory}`;

      try {
        let educationalDetails = JSON.parse(req.body.educationalDetails);
        userId = educationalDetails.userId;

        const user = await UserDao.getUserById(userId);

        if (!user) {
          return cb(Error("User not found the provided user Id."));
        }
        if (user.role === UserRole.CLIENT) {
          return cb(Error("Invalid user role."));
        }

        if (!educationalDetails.userId) {
          return cb(Error("University is required."), null);
        }

        if (!mongoose.Types.ObjectId.isValid(educationalDetails.userId)) {
          return cb(Error("Invalid user Id."), null);
        }

        if (!educationalDetails.university || typeof educationalDetails.university !== "string") {
          return cb(Error("University is required."), null);
        }

        if (!educationalDetails.degree || typeof educationalDetails.degree !== "string") {
          return cb(Error("Degree is required."), null);
        }

        if (!educationalDetails.fieldOfStudy || typeof educationalDetails.fieldOfStudy !== "string") {
          return cb(Error("Field of study is required."), null);
        }

        if (!educationalDetails.startYear || typeof educationalDetails.startYear !== "string") {
          return cb(Error("Start year is required."), null);
        }

        if (!educationalDetails.endYear || typeof educationalDetails.endYear !== "string") {
          return cb(Error("End year is required."), null);
        }

        fs.access(destination, (error: any) => {
          if (error) {
            return fs.mkdir(destination, (error: any) => cb(error, "destination"));
          } else {
            return cb(null, destination);
          }
        });
      } catch (error) {
        return cb(Error(error), null);
      }
    }

    const upload = multer({ storage: storage }).array("uploads", 3);

    try {
      upload(req, res, async function (error: any) {
        if (error) {
          return res.sendError(error + "");
        }
        try {
          if (req.files.length === 0) {
            return res.sendError("Upload files not found.");
          } else {
            try {
              let educationalDetails = JSON.parse(req.body.educationalDetails);

              if (!educationalDetails.userId) {
                isValid = false;
                return res.sendError("User Id is required.");
              }

              if (!mongoose.Types.ObjectId.isValid(educationalDetails.userId)) {
                isValid = false;
                return res.sendError("User Id is invalid.");
              }

              if (!educationalDetails.university || typeof educationalDetails.university !== "string") {
                isValid = false;
                return res.sendError("University is required.");
              }

              if (!educationalDetails.degree || typeof educationalDetails.degree !== "string") {
                isValid = false;
                return res.sendError("Degree is required.");
              }

              if (!educationalDetails.fieldOfStudy || typeof educationalDetails.fieldOfStudy !== "string") {
                isValid = false;
                return res.sendError("Field of study is required.");
              }

              if (!educationalDetails.startYear || typeof educationalDetails.startYear !== "string") {
                isValid = false;
                return res.sendError("Start year is required.");
              }

              if (!educationalDetails.endYear || typeof educationalDetails.endYear !== "string") {
                isValid = false;
                return res.sendError("Start year is required.");
              }
            } catch (error) {
              isValid = false;
              return res.sendError("Invalid educationalDetails json.");
            }

            if (isValid) {
              let request;
              try {
                request = JSON.parse(req.body.educationalDetails);
              } catch (error) {
                res.sendError(error);
              }

              const uploads: any = req.files;

              let signRequired: boolean = false;
              if (req.body.signRequired !== undefined) {
                signRequired = req.body.signRequired;
              }

              for (const upload of uploads) {
                const data: DUpload = {
                  userId: userId as unknown as Types.ObjectId,
                  originalName: upload.originalname.replace(/ /g, ""),
                  name: upload.filename,
                  type: upload.mimetype,
                  path: upload.path,
                  fileSize: upload.size,
                  extension: path.extname(upload.originalname) || req.body.extension,
                  category: uploadCategory,
                  signRequired: signRequired,
                };

                let uploadedFile = await UploadDao.createUpload(data);

                uploadedFiles.push(uploadedFile);
              }

              if (uploadedFiles.length === 0) {
                return res.sendError("Error while saving uploaded documents.");
              } else {
                let uploadedIds: any = uploadedFiles.map((item: any) => {
                  return item._id;
                });

                const education: any = {
                  userId: request.userId,
                  university: request.university,
                  degree: request.degree,
                  fieldOfStudy: request.fieldOfStudy,
                  startYear: request.startYear,
                  endYear: request.endYear,
                  reviewStatus: "PENDING",
                  uploadId: uploadedIds,
                };

                try {
                  let response = await UserDao.addEducationalInfo(education);
                  if (response == null) {
                    return res.sendError("Education qualificationss could not be added.");
                  } else {
                    return res.sendSuccess(response, "Education qualificationss added.");
                  }
                } catch (error) {
                  return res.sendError(error);
                }
              }
            }
          }
        } catch (error) {
          return res.sendError(error);
        }
      });
    } catch (error) {
      return res.sendError(error);
    }
  }

  export async function editEducationalInfo(req: Request, res: Response, next: NextFunction) {
    let uploadCategory = UploadCategory.EDUCATIONAL_DOCUMENTS;
    let userId: any = "";
    let uploadCount: number = 0;
    let deletingFiles = [];

    const storage = multer.diskStorage({
      destination: async (req, FileRes, cb) => {
        await editLicenseInfoValidationRules(req, cb);
      },
    });

    async function editLicenseInfoValidationRules(req: any, cb: any) {
      let destination = `${process.env.UPLOAD_PATH}/${uploadCategory}`;

      try {
        let educationalDetails = JSON.parse(req.body.educationalDetails);
        userId = educationalDetails.userId;

        if (!educationalDetails.userId) {
          return cb(Error("User Id is required."), null);
        }

        if (!mongoose.Types.ObjectId.isValid(educationalDetails.userId)) {
          return cb(Error("Invalid user Id."), null);
        }

        try {
          const user = await UserDao.getUserById(userId);

          if (!user) {
            return cb(Error("No user for the provided user Id."), null);
          }
          if (user.role === UserRole.CLIENT) {
            return cb(Error("Invalid user role."), null);
          }
        } catch (error) {
          return cb(Error(error), null);
        }

        if (!educationalDetails.educationId) {
          return cb(Error("Education Id is required."), null);
        }

        if (!mongoose.Types.ObjectId.isValid(educationalDetails.educationId)) {
          return cb(Error("Invalid license Id."), null);
        }

        try {
          const educationData = await EducationDao.getEducationalDetailsById(educationalDetails.educationId);

          deletingFiles = educationData.uploadId;
          uploadCount = deletingFiles.length;

          if (!educationData) {
            return cb(Error("No educational details found for the provided education id."));
          }
        } catch (error) {
          return cb(Error(error), null);
        }

        if (!educationalDetails.university || typeof educationalDetails.university !== "string") {
          return cb(Error("University is required."), null);
        }

        if (!educationalDetails.degree || typeof educationalDetails.degree !== "string") {
          return cb(Error("Degree is required."), null);
        }

        if (!educationalDetails.fieldOfStudy || typeof educationalDetails.fieldOfStudy !== "string") {
          return cb(Error("Field of study is required."), null);
        }

        if (!educationalDetails.startYear || typeof educationalDetails.startYear !== "string") {
          return cb(Error("Start year is required."), null);
        }

        if (!educationalDetails.endYear || typeof educationalDetails.endYear !== "string") {
          return cb(Error("End year is required."), null);
        }

        if (!educationalDetails.deletingUploadIds || !(educationalDetails.deletingUploadIds instanceof Array)) {
          return cb(Error("Deleting upload id should be an array.")), null;
        }

        if (educationalDetails.deletingUploadIds.length !== 0) {
          for (let upload of educationalDetails.deletingUploadIds) {
            if (!deletingFiles.includes(upload)) {
              return cb(Error("Invalid deleting upload ids."), null);
            }
          }
        }

        fs.access(destination, (error: any) => {
          if (error) {
            return fs.mkdir(destination, (error: any) => cb(error, "destination"));
          } else {
            return cb(null, destination);
          }
        });
      } catch (error) {
        return cb(Error("Invalid lisence details."), null);
      }
    }

    const upload = multer({ storage });

    try {
      upload.array("uploads", 3)(req, res, async function (error: any) {
        if (error) {
          return res.sendError(error + " ");
        }

        let educationalDetails: any;
        try {
          if (req.files.length === 0) {
            try {
              educationalDetails = JSON.parse(req.body.educationalDetails);
              userId = educationalDetails.userId;
            } catch (error) {
              return res.sendError(error);
            }

            if (!educationalDetails.userId) {
              return res.sendError("User id is required.");
            }

            if (!mongoose.Types.ObjectId.isValid(educationalDetails.userId)) {
              return res.sendError("Invalid user Id.");
            }

            try {
              const user = await UserDao.getUserById(userId);

              if (!user) {
                return res.sendError("No user for the provided user Id.");
              }
              if (user.role === UserRole.CLIENT) {
                return res.sendError("Invalid user role.");
              }
            } catch (error) {
              return res.sendError(error);
            }

            if (!educationalDetails.educationId) {
              return res.sendError("License Id is required.");
            }

            if (!mongoose.Types.ObjectId.isValid(educationalDetails.educationId)) {
              return res.sendError("Invalid license Id.");
            }

            try {
              const educationData = await EducationDao.getEducationalDetailsById(educationalDetails.educationId);

              if (!educationData) {
                return res.sendError("Cannot find educational details for the given Id.");
              }

              deletingFiles = educationData.uploadId;
              uploadCount = deletingFiles.length;
            } catch (error) {
              return res.sendError(error);
            }

            if (!educationalDetails.university || typeof educationalDetails.university !== "string") {
              return res.sendError("University is required.");
            }

            if (!educationalDetails.degree || typeof educationalDetails.degree !== "string") {
              return res.sendError("Degree is required");
            }

            if (!educationalDetails.fieldOfStudy || typeof educationalDetails.fieldOfStudy !== "string") {
              return res.sendError("Field of study is required.");
            }

            if (!educationalDetails.startYear || typeof educationalDetails.startYear !== "string") {
              return res.sendError("Start year is required.");
            }

            if (!educationalDetails.endYear || typeof educationalDetails.endYear !== "string") {
              return res.sendError("End year is required.");
            }

            if (!educationalDetails.deletingUploadIds || !(educationalDetails.deletingUploadIds instanceof Array)) {
              return res.sendError("Deleting upload id should be an array.");
            }

            if (educationalDetails.deletingUploadIds.length !== 0) {
              for (let upload of educationalDetails.deletingUploadIds) {
                if (!deletingFiles.includes(upload)) {
                  return res.sendError("Invalid deleting upload Ids");
                }
              }
            }

            let previouseducationalDetails: IEducation = null;
            let previousUploadIds: any[] = null;

            try {
              previouseducationalDetails = await EducationDao.getEducationalDetailsById(educationalDetails.educationId);
            } catch (error) {
              return res.sendError("Invalid education id");
            }

            previousUploadIds = previouseducationalDetails.uploadId;

            if (previousUploadIds.length === educationalDetails.deletingUploadIds.length) {
              return res.sendError("Atleast one document should be attached.");
            }

            async function trimData(id: any) {
              for (var i = 0; i < previouseducationalDetails.uploadId.length; i++) {
                if (previousUploadIds[i].toString() === id.toString()) {
                  previousUploadIds.splice(i, 1);
                }
              }
            }

            async function deleteFiles() {
              for (let id of educationalDetails.deletingUploadIds) {
                let resultHandler = async function (err: any) {
                  if (err) {
                    throw err;
                  }
                };
                try {
                  let upload = await UploadDao.getUpload(id);
                  await fs.unlink(upload.path, resultHandler);
                  await UploadDao.deleteUploadById(id);
                  await trimData(id);
                } catch (error) {
                  return res.sendError(error);
                }
              }
            }

            try {
              await deleteFiles();
            } catch (error) {
              return res.sendError("Error while deleting previous files" + error);
            }

            const newEducationalDetails: DEducation = {
              university: educationalDetails.university,
              degree: educationalDetails.degree,
              fieldOfStudy: educationalDetails.fieldOfStudy,
              startYear: educationalDetails.startYear,
              endYear: educationalDetails.endYear,
              uploadId: previousUploadIds,
            };

            try {
              let updatedEducationalDetails = await EducationDao.updateEducationalDetails(
                educationalDetails.educationId,
                newEducationalDetails
              );

              if (updatedEducationalDetails !== null) {
                return res.sendSuccess(updatedEducationalDetails, "Educational qualificationss updated.");
              }
            } catch (error) {
              return res.sendError(error);
            }
          } else {
            const uploads: any = req.files;
            let newUploads = [];

            try {
              educationalDetails = JSON.parse(req.body.educationalDetails);
            } catch (error) {
              return res.sendError(error);
            }

            let signRequired: boolean = false;
            if (req.body.signRequired !== undefined) {
              signRequired = req.body.signRequired;
            }

            for (const upload of uploads) {
              const data: DUpload = {
                userId: userId as unknown as Types.ObjectId,
                originalName: upload.originalname.replace(/ /g, ""),
                name: upload.filename,
                type: upload.mimetype,
                path: upload.path,
                fileSize: upload.size,
                extension: path.extname(upload.originalname) || req.body.extension,
                category: UploadCategory.EDUCATIONAL_DOCUMENTS,
                signRequired: signRequired,
              };

              let uploadedFile = await UploadDao.createUpload(data);

              newUploads.push(uploadedFile);
            }

            if (newUploads.length === 0) {
              return res.sendError("Error while saving uploads");
            } else {
              var uploadResult: any = newUploads.map((item: any) => {
                return item._id;
              });

              let previousEducationalDetails: IEducation = null;
              let previousUploadIds: any[] = null;
              try {
                previousEducationalDetails = await EducationDao.getEducationalDetailsById(educationalDetails.educationId);
              } catch (error) {
                return res.sendError("Invalid education id");
              }

              previousUploadIds = previousEducationalDetails.uploadId;

              async function trimData(id: any) {
                for (var i = 0; i < previousEducationalDetails.uploadId.length; i++) {
                  if (previousUploadIds[i].toString() === id.toString()) {
                    previousUploadIds.splice(i, 1);
                  }
                }
              }

              async function deleteFiles() {
                for (let id of educationalDetails.deletingUploadIds) {
                  let resultHandler = async function (err: any) {
                    if (err) {
                      throw err;
                    }
                  };
                  try {
                    let upload = await UploadDao.getUpload(id);
                    await fs.unlink(upload.path, resultHandler);
                    await UploadDao.deleteUploadById(id);
                    await trimData(id);
                  } catch (error) {
                    return res.sendError(error);
                  }
                }
              }

              async function updateDetails() {
                await deleteFiles();
                let finalUploads = previousUploadIds.concat(uploadResult);
                let requestBody = null;

                try {
                  requestBody = JSON.parse(req.body.educationalDetails);
                } catch (error) {
                  return res.sendError("Invalid educational details");
                }

                const newEducationalDetails: DEducation = {
                  university: requestBody.university,
                  degree: requestBody.degree,
                  fieldOfStudy: requestBody.fieldOfStudy,
                  startYear: requestBody.startYear,
                  endYear: requestBody.endYear,
                  uploadId: finalUploads,
                };

                try {
                  let updatedEducationalDetails = await EducationDao.updateEducationalDetails(
                    requestBody.educationId,
                    newEducationalDetails
                  );

                  if (updatedEducationalDetails) {
                    return res.sendSuccess(updatedEducationalDetails, "Your educational details have been updated successfully.");
                  }
                } catch (error) {
                  return res.sendError(error);
                }
              }
              try {
                await updateDetails();
              } catch (error) {
                return res.sendError(error);
              }
            }
          }
        } catch (error) {
          return res.sendError(error);
        }
      });
    } catch (error) {
      return res.sendError(error);
    }
  }

  export async function deleteEducationInfo(req: Request, res: Response, next: NextFunction) {
    const educationId = Types.ObjectId(req.params.id);
    let upload: Types.ObjectId;
    let deletedFiles: any[] = [];

    try {
      let educationDetails = await EducationDao.getEducationalDetailsById(educationId);

      if (!educationDetails) {
        return res.sendError("Invalid education Id.");
      }

      for (upload of educationDetails.uploadId) {
        let deletedFile = await UploadDao.deleteUploadById(upload);
        deletedFiles.push(deletedFile);
      }

      if (deletedFiles.length === educationDetails.uploadId.length) {
        try {
          let deletedEducationDetails = await EducationDao.deleteEducationDetailsById(educationId);

          if (deletedEducationDetails) {
            try {
              let therapist = await TherapistDao.getUserById(educationDetails.userId);
              let educationIdList: Types.ObjectId[] = therapist.qualifications;
              let newEducationList = educationIdList.filter((qualifications) => qualifications.toString() !== educationId.toString());
              if (newEducationList) {
                const updatedList: DTherapist = {
                  qualifications: newEducationList,
                };
                await UserDao.updateUser(therapist._id, updatedList);
                return res.sendSuccess(deletedEducationDetails, "Success");
              } else {
                return res.sendError("Error in filtered list");
              }
            } catch (error) {
              return res.sendError(error);
            }
          } else {
            return res.sendError("Education details could not be deleted.");
          }
        } catch (error) {
          return res.sendError(error);
        }
      }
      return res.sendSuccess(educationDetails, "Success");
    } catch (error) {
      return res.sendError(error);
    }
  }

  export async function deleteLicenseInfo(req: Request, res: Response, next: NextFunction) {
    const licenseId = Types.ObjectId(req.params.id);
    let upload: Types.ObjectId;
    let deletedFiles: any[] = [];

    try {
      let licenseDetails = await LicenseDao.getLicenseDetailsById(licenseId);

      if (!licenseDetails) {
        return res.sendError("Invalid license Id.");
      }

      for (upload of licenseDetails.uploadId) {
        let deletedFile = await UploadDao.deleteUploadById(upload);
        deletedFiles.push(deletedFile);
      }

      if (deletedFiles.length === licenseDetails.uploadId.length) {
        try {
          let deletedLicenseDetails = await LicenseDao.deleteLicenseDetailsById(licenseId);

          if (deletedLicenseDetails) {
            try {
              let therapist = await TherapistDao.getUserById(licenseDetails.userId);
              let licenseIdList: Types.ObjectId[] = therapist.licenseId;
              let newLicenseIdList = licenseIdList.filter((lisence) => lisence.toString() !== licenseId.toString());
              if (newLicenseIdList) {
                const updatedList: DTherapist = {
                  licenseId: newLicenseIdList,
                };
                let updatedTherapist = await UserDao.updateUser(therapist._id, updatedList);
                return res.sendSuccess(deletedLicenseDetails, "Success");
              } else {
                return res.sendError("Error in filtered list");
              }
            } catch (error) {
              return res.sendError(error);
            }
          } else {
            return res.sendError("License details could not be deleted.");
          }
        } catch (error) {
          return res.sendError(error);
        }
      }
      return res.sendSuccess(licenseDetails, "Success");
    } catch (error) {
      return res.sendError(error);
    }
  }


  export async function getEducationalDetailsByUserId(req: Request, res: Response, next: NextFunction) {
    const userId = req.params.id;

    try {
      let educationalDetails = await EducationDao.getEducationalDetailsByUserId(userId);

      return res.sendSuccess(educationalDetails, "Success");
    } catch (error) {
      return res.sendError(error);
    }
  }

  export async function addLicenseInfo(req: Request, res: Response, next: NextFunction) {
    let uploadCategory = UploadCategory.LICENSE_DOCUMENTS;
    let isValid: boolean = true;
    let uploadedFiles: any[] = [];
    let userId: any = "";

    const storage = multer.diskStorage({
      destination: async (req, FileRes, cb) => {
        await licenseInfoValidationRules(req, cb);
      },
    });

    async function licenseInfoValidationRules(req: any, cb: any) {
      let destination = `${process.env.UPLOAD_PATH}/${uploadCategory}`;

      try {
        let licenseDetails = JSON.parse(req.body.licenseDetails);
        userId = licenseDetails.userId;

        const user = await UserDao.getUserById(userId);

        if (!user) {
          return cb(Error("User not found the provided user Id."));
        }
        if (user.role === UserRole.CLIENT) {
          return cb(Error("Invalid user role."));
        }

        if (!licenseDetails.userId) {
          return cb(Error("University is required."), null);
        }

        if (!mongoose.Types.ObjectId.isValid(licenseDetails.userId)) {
          return cb(Error("Invalid user Id."), null);
        }

        if (!licenseDetails.title || typeof licenseDetails.title !== "string") {
          return cb(Error("Title is required."), null);
        }

        fs.access(destination, (error: any) => {
          if (error) {
            return fs.mkdir(destination, (error: any) => cb(error, "destination"));
          } else {
            return cb(null, destination);
          }
        });
      } catch (error) {
        return cb(Error(error), null);
      }
    }

    const upload = multer({ storage: storage }).array("uploads", 3);

    try {
      upload(req, res, async function (error: any) {
        if (error) {
          return res.sendError(error + "");
        }
        try {
          if (req.files.length === 0) {
            return res.sendError("Upload files not found.");
          } else {
            try {
              let licenseDetails = JSON.parse(req.body.licenseDetails);

              if (!licenseDetails.userId) {
                isValid = false;
                return res.sendError("User Id is required.");
              }

              if (!mongoose.Types.ObjectId.isValid(licenseDetails.userId)) {
                isValid = false;
                return res.sendError("User Id is invalid.");
              }

              if (!licenseDetails.title || typeof licenseDetails.title !== "string") {
                isValid = false;
                return res.sendError("Document title is required.");
              }
            } catch (error) {
              isValid = false;
              return res.sendError("Invalid licenseDetails json.");
            }

            if (isValid) {
              let request;
              try {
                request = JSON.parse(req.body.licenseDetails);
              } catch (error) {
                res.sendError(error);
              }

              const uploads: any = req.files;

              let signRequired: boolean = false;
              if (req.body.signRequired !== undefined) {
                signRequired = req.body.signRequired;
              }

              for (const upload of uploads) {
                const data: DUpload = {
                  userId: userId as unknown as Types.ObjectId,
                  originalName: upload.originalname.replace(/ /g, ""),
                  name: upload.filename,
                  type: upload.mimetype,
                  path: upload.path,
                  fileSize: upload.size,
                  extension: path.extname(upload.originalname) || req.body.extension,
                  category: uploadCategory,
                  signRequired: signRequired,
                };

                let uploadedFile = await UploadDao.createUpload(data);

                uploadedFiles.push(uploadedFile);
              }

              if (uploadedFiles.length === 0) {
                return res.sendError("Error while saving uploaded documents.");
              } else {
                let uploadedIds: any = uploadedFiles.map((item: any) => {
                  return item._id;
                });

                const license: DLicense = {
                  userId: request.userId,
                  title: request.title,
                  reviewStatus: "PENDING",
                  uploadId: uploadedIds,
                };

                try {
                  let response = await UserDao.addLicenseInfo(license);
                  if (response == null) {
                    return res.sendError("License and certificates could not be added.");
                  } else {
                    return res.sendSuccess(response, "License and certificates added.");
                  }
                } catch (error) {
                  return res.sendError(error);
                }
              }
            }
          }
        } catch (error) {
          return res.sendError(error);
        }
      });
    } catch (error) {
      return res.sendError(error);
    }
  }

  export async function editLicenseInfo(req: Request, res: Response, next: NextFunction) {
    let uploadCategory = UploadCategory.LICENSE_DOCUMENTS;
    let userId: any = "";
    let uploadCount: number = 0;
    let deletingFiles = [];

    const storage = multer.diskStorage({
      destination: async (req, FileRes, cb) => {
        await editLicenseInfoValidationRules(req, cb);
      },
    });

    async function editLicenseInfoValidationRules(req: any, cb: any) {
      let destination = `${process.env.UPLOAD_PATH}/${uploadCategory}`;

      try {
        let licenseDetails = JSON.parse(req.body.licenseDetails);
        userId = licenseDetails.userId;

        if (!licenseDetails.userId) {
          return cb(Error("University is required."), null);
        }

        if (!mongoose.Types.ObjectId.isValid(licenseDetails.userId)) {
          return cb(Error("Invalid user Id."), null);
        }

        try {
          const user = await UserDao.getUserById(userId);

          if (!user) {
            return cb(Error("No user for the provided user Id."));
          }
          if (user.role === UserRole.CLIENT) {
            return cb(Error("Invalid user role."));
          }
        } catch (error) {
          return cb(Error(error), null);
        }

        if (!licenseDetails.licenseId) {
          return cb(Error("License Id is required."), null);
        }

        if (!mongoose.Types.ObjectId.isValid(licenseDetails.licenseId)) {
          return cb(Error("Invalid license Id."), null);
        }

        try {
          const license = await LicenseDao.getLicenseDetailsById(licenseDetails.licenseId);

          deletingFiles = license.uploadId;
          uploadCount = deletingFiles.length;

          if (!license) {
            return cb(Error("No license for the provided license Id."));
          }
        } catch (error) {
          return cb(Error(error), null);
        }

        if (!licenseDetails.title || typeof licenseDetails.title !== "string") {
          return cb(Error("Title is required."), null);
        }

        if (!licenseDetails.deletingUploadIds || !(licenseDetails.deletingUploadIds instanceof Array)) {
          return cb(Error("Deleting upload id should be an array."));
        }

        if (licenseDetails.deletingUploadIds.length !== 0) {
          for (let upload of licenseDetails.deletingUploadIds) {
            if (!deletingFiles.includes(upload)) {
              return cb(Error("Invalid deleting upload Ids"), null);
            }
          }
        }
        fs.access(destination, (error: any) => {
          if (error) {
            return fs.mkdir(destination, (error: any) => cb(error, "destination"));
          } else {
            return cb(null, destination);
          }
        });
      } catch (error) {
        return cb(Error("Invalid lisence details"), null);
      }
    }

    const upload = multer({ storage });

    try {
      upload.array("uploads", 3)(req, res, async function (error: any) {
        if (error) {
          return res.sendError(error + "");
        }

        let licenseDetails: any;
        try {
          if (req.files.length === 0) {
            try {
              licenseDetails = JSON.parse(req.body.licenseDetails);
              userId = licenseDetails.userId;
            } catch (error) {
              return res.sendError(error);
            }

            if (!licenseDetails.userId) {
              return res.sendError("User id is required.");
            }

            if (!mongoose.Types.ObjectId.isValid(licenseDetails.userId)) {
              return res.sendError("Invalid user Id.");
            }

            try {
              const user = await UserDao.getUserById(userId);

              if (!user) {
                return res.sendError("No user for the provided user Id.");
              }
              if (user.role === UserRole.CLIENT) {
                return res.sendError("Invalid user role.");
              }
            } catch (error) {
              return res.sendError(error);
            }

            if (!licenseDetails.licenseId) {
              return res.sendError("License Id is required.");
            }

            if (!mongoose.Types.ObjectId.isValid(licenseDetails.licenseId)) {
              return res.sendError("Invalid license Id.");
            }

            try {
              const license = await LicenseDao.getLicenseDetailsById(licenseDetails.licenseId);

              deletingFiles = license.uploadId;
              uploadCount = deletingFiles.length;

              if (!license) {
                return res.sendError("No license for the provided license Id.");
              }
            } catch (error) {
              return res.sendError(error);
            }

            if (!licenseDetails.title || typeof licenseDetails.title !== "string") {
              return res.sendError("Title is required.");
            }

            if (!licenseDetails.deletingUploadIds || !(licenseDetails.deletingUploadIds instanceof Array)) {
              return res.sendError("Deleting upload id should be an array.");
            }

            if (licenseDetails.deletingUploadIds.length !== 0) {
              for (let upload of licenseDetails.deletingUploadIds) {
                if (!deletingFiles.includes(upload)) {
                  return res.sendError("Invalid deleting upload Ids");
                }
              }
            }

            let previousLicesnceDetails: ILicense = null;
            let previousUploadIds: any[] = null;
            try {
              previousLicesnceDetails = await LicenseDao.getLicenseDetailsById(licenseDetails.licenseId);
            } catch (error) {
              return res.sendError("Invalid license id");
            }

            previousUploadIds = previousLicesnceDetails.uploadId;

            if (previousUploadIds.length === licenseDetails.deletingUploadIds.length) {
              return res.sendError("Atleast one document should be attached.");
            }

            async function trimData(id: any) {
              for (var i = 0; i < previousLicesnceDetails.uploadId.length; i++) {
                if (previousUploadIds[i].toString() === id.toString()) {
                  previousUploadIds.splice(i, 1);
                }
              }
            }

            async function deleteFiles() {
              for (let id of licenseDetails.deletingUploadIds) {
                let resultHandler = async function (err: any) {
                  if (err) {
                    throw err;
                  }
                };
                try {
                  let upload = await UploadDao.getUpload(id);
                  await fs.unlink(upload.path, resultHandler);
                  await UploadDao.deleteUploadById(id);
                  await trimData(id);
                } catch (error) {
                  return res.sendError(error);
                }
              }
            }

            try {
              await deleteFiles();
            } catch (error) {
              return res.sendError("Error while deleting previous files" + error);
            }

            const licenseData: DLicense = {
              title: licenseDetails.title,
              uploadId: previousUploadIds,
            };

            try {
              let updatedLicense = await LicenseDao.updatedLicenseDetails(licenseDetails.licenseId, licenseData);

              if (updatedLicense !== null) {
                return res.sendSuccess(updatedLicense, "Licence updated.");
              }
            } catch (error) {
              return res.sendError(error);
            }
          } else {
            const uploads: any = req.files;
            let newUploads = [];

            try {
              licenseDetails = JSON.parse(req.body.licenseDetails);
            } catch (error) {
              return res.sendError(error);
            }

            let signRequired: boolean = false;
            if (req.body.signRequired !== undefined) {
              signRequired = req.body.signRequired;
            }

            for (const upload of uploads) {
              const data: DUpload = {
                userId: userId as unknown as Types.ObjectId,
                originalName: upload.originalname.replace(/ /g, ""),
                name: upload.filename,
                type: upload.mimetype,
                path: upload.path,
                fileSize: upload.size,
                extension: path.extname(upload.originalname) || req.body.extension,
                category: UploadCategory.LICENSE_DOCUMENTS,
                signRequired: signRequired,
              };

              let uploadedFile = await UploadDao.createUpload(data);

              newUploads.push(uploadedFile);
            }

            if (newUploads.length === 0) {
              return res.sendError("Error while saving uploads");
            } else {
              var uploadResult: any = newUploads.map((item: any) => {
                return item._id;
              });

              let previousLicesnceDetails: ILicense = null;
              let previousUploadIds: any[] = null;
              try {
                previousLicesnceDetails = await LicenseDao.getLicenseDetailsById(licenseDetails.licenseId);
              } catch (error) {
                return res.sendError("Invalid license id");
              }

              previousUploadIds = previousLicesnceDetails.uploadId;

              async function trimData(id: any) {
                for (var i = 0; i < previousLicesnceDetails.uploadId.length; i++) {
                  if (previousUploadIds[i].toString() === id.toString()) {
                    previousUploadIds.splice(i, 1);
                  }
                }
              }

              async function deleteFiles() {
                for (let id of licenseDetails.deletingUploadIds) {
                  let resultHandler = async function (err: any) {
                    if (err) {
                      throw err;
                    }
                  };
                  try {
                    let upload = await UploadDao.getUpload(id);
                    await fs.unlink(upload.path, resultHandler);
                    await UploadDao.deleteUploadById(id);
                    await trimData(id);
                  } catch (error) {
                    return res.sendError(error);
                  }
                }
              }

              async function updateDetails() {
                await deleteFiles();
                let finalUploads = previousUploadIds.concat(uploadResult);
                let requestBody = null;

                try {
                  requestBody = JSON.parse(req.body.licenseDetails);
                } catch (error) {
                  return res.sendError("Invalid license details");
                }

                const newLicensce: DLicense = {
                  title: requestBody.title,
                  uploadId: finalUploads,
                };

                try {
                  let updatedLicense = await LicenseDao.updatedLicenseDetails(requestBody.licenseId, newLicensce);
                  if (updatedLicense) {
                    return res.sendSuccess(updatedLicense, "Success");
                  }
                } catch (error) {
                  return res.sendError(error);
                }
              }
              try {
                await updateDetails();
              } catch (error) {
                return res.sendError(error);
              }
            }
          }
        } catch (error) {
          return res.sendError(error);
        }
      });
    } catch (error) {
      return res.sendError(error);
    }
  }

  export async function getLisenceDetailsByUserId(req: Request, res: Response, next: NextFunction) {
    const userId = req.params.id;

    try {
      let licenseDetails = await LicenseDao.getLicenseDetailsByUserId(userId);

      return res.sendSuccess(licenseDetails, "Success");
    } catch (error) {
      return res.sendError(error);
    }
  }

  export async function updateProfileImage(req: Request, res: Response, next: NextFunction) {
    const userId = req.user._id;
    const uploadCategory = UploadCategory.PROFILE_IMAGE;

    const storage = multer.diskStorage({
      destination: async (req, FileRes, cb) => {
        await updateProfileImageValidationRules(req, cb);
      },
    });

    async function updateProfileImageValidationRules(req: any, cb: any) {
      let destination = `${process.env.UPLOAD_PATH}/${uploadCategory}`;

      try {
        fs.access(destination, (error: any) => {
          if (error) {
            return fs.mkdir(destination, (error: any) => cb(error, "destination"));
          } else {
            return cb(null, destination);
          }
        });
      } catch (error) {
        return cb(Error(error), null);
      }
    }

    async function deleteOldPhoto(uploadId: StringOrObjectId) {
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

    const upload = multer({ storage: storage }).single("profileImage");

    try {
      upload(req, res, async function (error: any) {
        if (error) {
          return res.sendError(error + " ");
        } else {
          if (req.file == null || req.file === undefined) {
            return res.sendError("Image not found.");
          } else {
            const image = req.file;

            let signRequired: boolean = false;

            if (req.body.signRequired !== undefined) {
              signRequired = req.body.signRequired;
            }
            const data: DUpload = {
              userId: userId as unknown as Types.ObjectId,
              originalName: image.originalname.replace(/ /g, ""),
              name: image.filename,
              type: image.mimetype,
              path: image.path,
              fileSize: image.size,
              extension: path.extname(image.originalname) || req.body.extension,
              category: uploadCategory,
              signRequired: signRequired,
            };
            try {
              let user = await UserDao.getUserByIdNotPopulated(userId);
              let uploadedImage: IUpload = null;


              if (user.photoId) {
                console.log("photoId", user.photoId)
                let isFileDeleted = await deleteOldPhoto(user.photoId);
                console.log("isFileDeleted", isFileDeleted)
                if (isFileDeleted) {
                  uploadedImage = await UploadDao.createUpload(data);

                  if (uploadedImage == null) {
                    return res.sendError("Error while uploading the image.");
                  }

                  const userDetails: DUser = {
                    photoId: uploadedImage._id,
                  };

                  let updatedUser = await UserDao.updateUser(userId, userDetails);

                  if (updatedUser == null) {
                    return res.sendError("User could not be updated.");
                  }

                  return res.sendSuccess(updatedUser, "Success");
                } else {
                  return res.sendError("Error while deleting the file.");
                }
              } else {
                uploadedImage = await UploadDao.createUpload(data);

                if (uploadedImage == null) {
                  return res.sendError("Error while uploading the image.");
                }

                const userDetails: DUser = {
                  photoId: uploadedImage._id,
                };

                let updatedUser = await UserDao.updateUser(userId, userDetails);

                if (updatedUser == null) {
                  return res.sendError("User could not be updated.");
                }

                return res.sendSuccess(updatedUser, "Success");
              }
            } catch (error) {
              return res.sendError(error);
            }
          }
        }
      });
    } catch (error) {
      return res.sendError("Failed to upload image. " + error);
    }
  }


  export async function updateTHERAPISTProfile(req: Request, res: Response, next: NextFunction) {
    const userId = req.user._id;
    console.log(userId)
    let newExpTags: Types.ObjectId[] = [];
    let profileDetails = req.body
    const primaryPhone = req.body.primaryPhone;
    try {

      if (primaryPhone) {
        let isprimaryPhoneUsed = await UserDao.getUserByPrimaryPhone(primaryPhone);

        if (isprimaryPhoneUsed && userId.toString() !== isprimaryPhoneUsed._id.toString()) {
          return res.sendError("Provided primary phone is already taken.");
        }
      }

      if (!profileDetails.firstname || typeof profileDetails.firstname !== "string") {
        return res.sendError("Firstname is required.");
      }

      if (!profileDetails.lastname || typeof profileDetails.lastname !== "string") {
        return res.sendError("lastname is required.");
      }

      if (!profileDetails.username || typeof profileDetails.username !== "string") {
        return res.sendError("Username is required.");
      }


      if (!profileDetails.gender || typeof profileDetails.gender !== "string") {
        return res.sendError("gender is required.");
      }

      if (!profileDetails.primaryPhone || typeof profileDetails.primaryPhone !== "string") {
        return res.sendError("primary phone number is required.");
      }

      const user = await TherapistDao.getUserById(userId);

      if (user._id.toString() === userId.toString()) {
        if (profileDetails.experiencedIn && profileDetails.experiencedIn.length > 0) {
          await Promise.all(
            profileDetails.experiencedIn.map(async (tag: any) => {
              const isFound = await AdminDao.getExperienceTagsByName(tag);
              if (!isFound || isFound == null) {
                const addedTag = await AdminDao.addExperienceTag(tag);
                newExpTags.push(addedTag._id);
              } else {
                newExpTags.push(isFound._id);
              }
            })
          );
        }
      }

      const therapist: DTherapist = {
        description: profileDetails.description,
        firstname: profileDetails.firstname,
        lastname: profileDetails.lastname,
        email: profileDetails.email,
        gender: profileDetails.gender,
        dateOfBirth: profileDetails.dateOfBirth,
        experiencedIn: newExpTags,
        profession:
          profileDetails.profession !== null || profileDetails.profession !== undefined || profileDetails.profession !== ""
            ? Types.ObjectId(profileDetails.profession)
            : null,
        username: profileDetails.username,
        primaryPhone: profileDetails.primaryPhone,
        workingHours: profileDetails.workingHours,
        streetAddress: profileDetails.streetAddress,
        city: profileDetails.city,
        state: profileDetails.state,
        zipCode: profileDetails.zipCode,
        vacation: profileDetails.vacation,

      };

      let updatedTherapist = await UserDao.updateUser(userId, therapist);

      if (!updatedTherapist) {
        return res.sendError("Failed to update the therapist.");
      }

      return res.sendSuccess(updatedTherapist, "Your profile has been updated successfully.");
    } catch (error) {
      return res.sendError(error);
    }
  }

  export async function updateClientProfile(req: Request, res: Response, next: NextFunction) {
    const userId = req.user._id;
    const description = req.body.description;
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const email = req.body.email;
    const gender = req.body.gender;
    const dateOfBirth = req.body.dateOfBirth;
    const username = req.body.username;
    const streetAddress = req.body.streetAddress;
    const city = req.body.city;
    const state = req.body.state;
    const zipCode = req.body.zipCode;
    const primaryPhone = req.body.primaryPhone;
    const homePhone = req.body.homePhone;
    const workPhone = req.body.workPhone;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.sendError(errors.array()[0]["msg"]);
    }

    try {


      if (primaryPhone) {
        let isprimaryPhoneUsed = await UserDao.getUserByPrimaryPhone(primaryPhone);

        if (isprimaryPhoneUsed && userId.toString() !== isprimaryPhoneUsed._id.toString()) {
          return res.sendError("Provided primary phone is already taken.");
        }
      }

      const client: DClient = {
        description: description,
        firstname: firstname,
        lastname: lastname,
        // email: email,
        gender: gender,
        dateOfBirth: dateOfBirth,
        username: username,
        streetAddress: streetAddress,
        city: city,
        state: state,
        zipCode: zipCode,
        primaryPhone: primaryPhone,
        homePhone: homePhone,
        workPhone: workPhone
      };

      let updatedClient = await UserDao.updateUser(userId, client);

      if (updatedClient == null) {
        return res.sendError("Something went wrong. Please try again later.");
      }

      return res.sendSuccess(updatedClient, "Your profile has been updated successfully.");

    } catch (error) {
      return res.sendError(error);
    }
  }


  export async function changePassword(req: Request, res: Response, next: NextFunction) {
    const userId = req.user._id;
    const role = req.user.role;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.sendError(errors.array()[0]["msg"]);
    }

    if (role === UserRole.THERAPIST || role === UserRole.CLIENT) {
      if (newPassword === confirmPassword) {
        try {
          const user: IUser = await UserDao.getUserByIdTest(userId);
          console.log(user)
          if (user) {
            console.log("jii")
            let isMatch = await user.comparePassword(oldPassword);
            console.log(isMatch)
            if (isMatch) {
              let hashedPassword = await Util.passwordHashing(newPassword);

              const updatedPassword: DUser = {
                password: hashedPassword,
              };

              console.log(updatedPassword)
              try {
                let updatedUser = await UserDao.updateUser(userId, updatedPassword);
                console.log(updatedUser)
                if (!updatedUser) {
                  return res.sendError("Password could not be changed.");
                }

                return res.sendSuccess(updatedUser, "Password changed.");
              } catch (error) {
                return res.sendError(error);
              }
            } else {
              return res.sendError("Invalid old password.");
            }
          } else {
            return res.sendError("User could not be found.");
          }
        } catch (error) {
          return res.sendError(error);
        }
      } else {
        return res.sendError("Mismatched passwords.");
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

  export async function getClientByClientId(req: Request, res: Response) {
    const role = req.user.role;
    const clientId = req.params.clientId;

    if (role == UserRole.THERAPIST) {
      let client = await ClientDao.getUserById(clientId);

      return res.sendSuccess(client, "Success");
    } else {
      return res.sendError("Invalid user role!");
    }
  }
}
