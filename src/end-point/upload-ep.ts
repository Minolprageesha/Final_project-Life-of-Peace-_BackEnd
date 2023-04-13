import { NextFunction, Request, Response } from "express";
import { ApplicationError } from "../common/application-error";
import { Util } from "../common/util";
import { UploadDao } from "../dao/upload-dao";
import * as fs from "fs";
import { JwtToken } from "../middleware/jwt-token";
export namespace UploadEp {

  export async function getImageFromId(req: Request, res: Response) {
    const imageId = req.params.imageId;

    if (!Util.isObjectId(imageId)) {
      return res.sendError("Invalid Image Id.");
    }

    const upload = await UploadDao.getUpload(imageId);

    if (fs.existsSync(upload.path)) {
      return fs.createReadStream(upload.path).pipe(res);
    } else {
      return fs.createReadStream("./uploads/logo.jpg").pipe(res);
    }
  }
  export async function getImageFromToken(req: Request, res: Response) {
    const token = req.params.token;
    try {
      const data: any = await JwtToken.getVerifiedDecodedToken(token);
      if (data.user_id) {
        const imageId = req.params.imageId;
        if (!Util.isObjectId(imageId)) {
          return res.sendError("Invalid Image Id.");
        }
        const upload = await UploadDao.getUpload(imageId);

        if (upload.type == "audio" || upload.category == "CALL_RECORDS") {
          return res.sendError("Invalid file type & category.");
        }
        if (fs.existsSync(upload.path)) {
          return fs.createReadStream(upload.path).pipe(res);
        } else {
          return fs.createReadStream("./uploads/logo.jpg").pipe(res);
        }
      } else {
        return res.sendError("Invalid Token.");
      }
    } catch (error) {
      return res.sendError("Invalid Token.");
    }
  }
}
