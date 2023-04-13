import { DUpload, IUpload } from "../models/upload-model";
import Upload from "../schemas/upload-schema";
import { AppLogger } from "../common/logging";
import { Types } from "mongoose";
import { StringOrObjectId } from "../common/util";

export namespace UploadDao {
  export async function createUpload(data: DUpload): Promise<IUpload> {
    const iUpload: IUpload = new Upload(data);
    return await iUpload.save();
  }

  export async function getUpload(imageId: string) {
    const upload = await Upload.findById(imageId);
    return upload;
  }

  export async function deleteUploadById(uploadId: StringOrObjectId) {
    Upload.findOneAndDelete({ _id: uploadId })
      .then((docs) => {
        if (docs) {
          return uploadId;
        } else {
          AppLogger.info("Upload ID not found");
        }
      })
      .catch((err) => {
        AppLogger.info(err);
      });
    AppLogger.info(`Got Delete for ID: ${uploadId}`);
  }

  export async function deleteUploadByUploadId(uploadId: Types.ObjectId):Promise<any>{
    const deletedFile = await Upload.findByIdAndDelete(uploadId);
    return deletedFile;
  }

  export async function deleteUpload(uploadId:Types.ObjectId) {
      return await UploadDao.deleteUploadByUploadId(uploadId);
  }
}
