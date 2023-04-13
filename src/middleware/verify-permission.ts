/// <reference path="../global.d.ts" />
import { Permission, UserRole } from "../models/user-model";
import { NextFunction, Request, Response } from "express";
import { ApplicationError } from "../common/application-error";
import User = Express.User;

export function verifyPermission(...permissions: Permission[]) {
    return function (req: Request, res: Response, next: NextFunction) {
        const [success, message] = checkPermission(req.user, permissions);
        if (success) {
            next();
        } else {
            throw new ApplicationError(message);
        }
    };
}

export function checkPermission(user: User, permissions: Permission[]): [boolean, string] {
    switch (user.role) {
        case UserRole.CLIENT:
            return [false, "Access Denied for Clients."]
        case UserRole.THERAPIST:
            return [false, "Access Denied for THERAPISTs."];
        default:
            return [false, "Unknown user role"];
    }
}