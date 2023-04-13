import { Express } from "express";
import { TherapistEp } from "../end-point/therapist-ep";
import { UserEp } from "../end-point/user-ep";
import { Authentication } from "../middleware/authentication";

export function initClientRoutes(app: Express) {
    app.post(
        "/api/auth/addReview",
        Authentication.clientVerification,
        TherapistEp.addReviewValidationRules(),
        TherapistEp.addReview
      );
      
  app.get("/api/auth/getClienByClientId/:clientId", Authentication.THERAPISTAndClientVerification, UserEp.getClientByClientId);
}


