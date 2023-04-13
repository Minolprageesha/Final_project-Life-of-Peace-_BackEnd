import { Express } from "express";
import { UploadEp } from "../end-point/upload-ep";
import multer = require("multer");

export function initUploadRoutes(app: Express) {
  app.get('/api/public/file/:imageId/:name?/:token', UploadEp.getImageFromId);
  app.get('/api/public/file/:imageId/:name?/:token', UploadEp.getImageFromToken);
  app.get('/api/public/files/:imageId/:name?', UploadEp.getImageFromId);

}
