import { Express } from "express";
import { AdminEp } from "../end-point/admin-ep";
import { FriendRequestEp } from "../end-point/friend-request-ep";
import { TherapistEp } from "../end-point/therapist-ep";
import { UserEp } from "../end-point/user-ep";
import { Authentication } from "../middleware/authentication";

export function initAdminRoutes(app: Express) {



  app.post("/api/auth/create/experienceTag", AdminEp.addExperienceTags);

  app.get("/api/auth/getExperienceTags/:limit?/:offset?", AdminEp.getAllExperienceTags);

  app.get("/api/auth/getAllPendingClients/:limit?/:offset?", Authentication.superAdminVerification, AdminEp.getAllPendingClients);

  app.get("/api/auth/getAllApprovedClients/:limit?/:offset?", Authentication.superAdminVerification, AdminEp.getAllApprovedClients);

  app.post("/api/auth/approveRejectClient", Authentication.superAdminVerification, AdminEp.approveRejectClient);

  app.get("/api/auth/getAllPendingTherapists/:limit?/:offset?", Authentication.superAdminVerification, AdminEp.getAllPendingTherapists);

  app.get(
    "/api/auth/getAllApprovedTherapists/:limit?/:offset?",
    Authentication.superAdminVerification,
    AdminEp.getAllApprovedTherapists
  );

  app.post("/api/auth/approveRejectTherapist", Authentication.superAdminVerification, AdminEp.approveRejectTherapist);


  app.get("/api/auth/getAllClients/:limit?/:offset?", Authentication.superAdminVerification, AdminEp.getAllClients);
  app.post(
    "/api/auth/searchClientsByAdmin/:limit?/:offset?",
    Authentication.superAdminVerification,
    AdminEp.searchClientsByAdmin
  );

  app.get(
    "/api/auth/getAllTherapists/:limit?/:offset?",
    Authentication.superAdminVerification,
    AdminEp.getAllTherapists
  );
  app.post(
    "/api/auth/searchTherapistsByAdmin/:limit?/:offset?",
    Authentication.superAdminVerification,
    AdminEp.searchTherapistsByAdmin
  );


 
  app.post("/api/auth/blockUserByAdmin", Authentication.superAdminVerification, AdminEp.blockUserByAdmin);

  app.post("/api/auth/unblockUserByAdmin", Authentication.superAdminVerification, AdminEp.unblockUserByAdmin);


  app.post(
    "/api/auth/updateExperienceTags",
    AdminEp.updateExpTagValidationRules(),
    AdminEp.updateExperienceTags
  );

  app.delete(
    "/api/auth/deleteExperienceTag/:deleteExperienceTagId",
    Authentication.superAdminVerification,
    AdminEp.deleteExperienceTag
  );

  app.delete("/api/auth/deleteUser/:userId", Authentication.superAdminVerification, AdminEp.deleteUser);

  
  app.get(
    "/api/auth/getUserByUserIdAdmin/:therapistId/:clientId",
    Authentication.superAdminVerification,
    UserEp.viewUserProfileByIdAdmin
  );


  app.get("/api/auth/checkIfUserIsFriendAdmin/:clientId/:therapistId",
    Authentication.superAdminVerification,
    FriendRequestEp.checkIfUserIsFriendAdmin);

  app.get("/api/auth/viewAllFriendsByTherapistAdmin/:therapistId",
    Authentication.superAdminVerification,
    FriendRequestEp.viewAllRequestsByTherapistAdmin);

  
  // for statistics //
  app.get("/api/auth/get-user-counts", Authentication.superAdminVerification, AdminEp.getTotalUsers);

}
