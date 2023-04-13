import { Express } from "express";
import { TherapistEp } from "../end-point/therapist-ep";
import { Authentication } from "../middleware/authentication";

export function initTherapistRoutes(app: Express) {
    app.post(
        "/api/auth/searchTherapists/:limit/:offset",
        Authentication.clientVerification,
        TherapistEp.searchTherapists
    );
    app.get(
        "/api/auth/viewReviewsByTherapistId/:id",
        Authentication.THERAPISTAndClientVerification,
        TherapistEp.viewReviewsByTherapistId
      );
}