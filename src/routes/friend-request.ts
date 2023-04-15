import { Express } from "express";
import { FriendRequestEp } from "../end-point/friend-request-ep";
import { Authentication } from "../middleware/authentication";

export function initRequestRoutes(app: Express) {
    app.post("/api/auth/createRequestByClient/:therapistId", Authentication.clientVerification, FriendRequestEp.createRequestByClient);

    app.post("/api/auth/updateRequestByTherapist", Authentication.therapistVerification, FriendRequestEp.updateRequestByTherapist);

    app.get("/api/auth/viewAllRequestsByTherapist/:limit/:offset", Authentication.therapistVerification, FriendRequestEp.viewAllRequestsByTherapist);

    app.get("/api/auth/viewAllRequestsByClient/:limit/:offset", Authentication.clientVerification, FriendRequestEp.viewAllRequestsByClient);

    app.get("/api/auth/checkIfUserIsFriend/:userId", Authentication.THERAPISTAndClientVerification, FriendRequestEp.checkIfUserIsFriend);

    app.get("/api/auth/viewAllSentRequestsByClient", Authentication.clientVerification, FriendRequestEp.viewAllSentRequestsByClient);

    app.get("/api/auth/chatList",  FriendRequestEp.viewAllChatList);

    app.post("/api/auth/removeFriendRequest/:requestId", Authentication.THERAPISTAndClientVerification, FriendRequestEp.removeFriendRequest);

    app.post("/api/auth/unfriendUser/:requestId", Authentication.THERAPISTAndClientVerification, FriendRequestEp.unfriendUser);
}
