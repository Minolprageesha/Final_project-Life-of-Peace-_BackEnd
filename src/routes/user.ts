import { Express } from "express";
import { UserEp } from "../end-point/user-ep";
import { Authentication } from "../middleware/authentication";

export function initUserRoutes(app: Express) {
  app.post("/api/public/login", UserEp.loginWithEmailValidationRules(), UserEp.loginWithEmail);

  app.post("/api/public/verifyTherapistLogin", UserEp.therapistLoginWithEmail);

  app.post("/api/public/signUp", UserEp.signUpValidationRules(), UserEp.signUp);

  app.post("/api/public/signUpClient", UserEp.signUpValidationRules(), UserEp.signUpClient);

  app.post("/api/public/verifyByCode", UserEp.verifyUserByCode);

  app.post("/api/public/forgotPassword", UserEp.forgotPasswordValidationRules(), UserEp.sendForgotPasswordMail);

  app.post("/api/public/resetPassword", UserEp.resetPassword);

  app.get("/api/auth/me", UserEp.getMe);

  app.post("/api/public/contact-us", UserEp.contactValidationRules(), UserEp.contactUs);

  app.post("/api/public/customer-review", UserEp.reviewValidationRules(), UserEp.customerReview);

  app.post("/api/auth/education", Authentication.therapistVerification, UserEp.addEducationalInfo);

  app.post("/api/auth/lisence", Authentication.therapistVerification, UserEp.addLicenseInfo);

  app.post("/api/auth/changePassword", UserEp.changePasswordValidationRules(), UserEp.changePassword);

  app.get("/api/auth/getEducationalDetailsByUserId/:id", UserEp.getEducationalDetailsByUserId);

  app.get("/api/auth/getLisenceDetailsByUserId/:id", UserEp.getLisenceDetailsByUserId);

  app.post("/api/auth/editLicenseDetails", Authentication.therapistVerification, UserEp.editLicenseInfo);

  app.post("/api/auth/editEducationalDetails", Authentication.therapistVerification, UserEp.editEducationalInfo);

  app.delete("/api/auth/deleteEducationDetails/:id", Authentication.therapistVerification, UserEp.deleteEducationInfo);

  app.delete("/api/auth/deleteLisenceDetails/:id", Authentication.therapistVerification, UserEp.deleteLicenseInfo);

  app.post("/api/auth/updateProfileImage", Authentication.THERAPISTAndClientVerification, UserEp.updateProfileImage);

  app.post("/api/auth/updateTherapistProfile", Authentication.therapistVerification, UserEp.updateTHERAPISTProfile);

  app.post("/api/auth/updateClientProfile", Authentication.clientVerification, UserEp.updateClientProfile);
  app.get("/api/auth/getUserByUserId/:id", Authentication.THERAPISTAndClientVerification, UserEp.viewUserProfileById);
}


