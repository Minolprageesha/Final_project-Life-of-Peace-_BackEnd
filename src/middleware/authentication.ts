import * as passport from "passport";
import { NextFunction, Request, Response } from "express";
import { AppLogger } from "../common/logging";
import { UserRole } from "../models/user-model";

export class Authentication {
  public static verifyToken(req: Request, res: Response, next: NextFunction) {
    return passport.authenticate("jwt", { session: false }, (err: any, user: any, info: any) => {
      if (err || !user) {
        AppLogger.error(`Login Failed. reason: ${info}`);
        return res.sendError(info);
      }
      req.user = user;
      req.body.user = user._id;
      return next();
    })(req, res, next);
  }

  public static clientVerification(req: Request, res: Response, next: NextFunction) {
    if (req.user.role === UserRole.CLIENT) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "No authorization to access this route.",
      });
    }
  }

  public static therapistVerification(req: Request, res: Response, next: NextFunction) {
    if (req.user.role === UserRole.THERAPIST ) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "No authorization to access this route.",
      });
    }
  }

  public static superAdminVerification(req: Request, res: Response, next: NextFunction) {
    if (req.user.role === UserRole.SUPER_ADMIN) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "No authorization to access this route.",
      });
    }
  }

  public static THERAPISTAndClientVerification(req: Request, res: Response, next: NextFunction) {
    if (req.user.role === UserRole.CLIENT || req.user.role === UserRole.THERAPIST) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "No authorization to access this route.",
      });
    }
  }

  public static therapistAndAdminVerification(req: Request, res: Response, next: NextFunction) {
    if (req.user.role === UserRole.SUPER_ADMIN || req.user.role === UserRole.THERAPIST) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "No authorization to access this route.",
      });
    }
  }

  public static clientAndAdminVerification(req: Request, res: Response, next: NextFunction) {
    if (req.user.role === UserRole.SUPER_ADMIN || req.user.role === UserRole.CLIENT) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "No authorization to access this route.",
      });
    }
  }

  public static allUserVerification(req: Request, res: Response, next: NextFunction) {
    if (req.user.role === UserRole.SUPER_ADMIN || req.user.role === UserRole.CLIENT || req.user.role === UserRole.THERAPIST) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "No authorization to access this route.",
      });
    }
  }
}
