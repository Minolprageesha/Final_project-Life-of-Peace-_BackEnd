import { Types } from "mongoose";
import { StringOrObjectId } from "../common/util";
import { DLicense, ILicense } from "../models/license-model";
import License from "../schemas/license-schema";

export namespace LicenseDao {
    export async function getLicenseDetailsByUserId(userId:any):Promise<ILicense[]>{
        const response = await License.find({userId:userId}).populate([{path:'uploadId'}]);
        return response;                
    }

    export async function getLicenseDetailsById(id:Types.ObjectId):Promise<ILicense>{
        const response =  await License.findById(id);
        return response;
    }

    export async function updatedLicenseDetails(licenseId:Types.ObjectId,licenseDetails:DLicense):Promise<ILicense>{
        const response = await License.findByIdAndUpdate(licenseId, licenseDetails , {new:true});
        return response;
    }

    export async function deleteLicenseDetailsById(id:Types.ObjectId):Promise<ILicense>{
        const response = await License.findByIdAndDelete(id);
        return response;
    }

    export async function deleteLicenseDetailsByTherapistId(
        userId: StringOrObjectId,
        deleteUploads : (value:StringOrObjectId) => Promise<boolean>
      ): Promise<number> {
        const licenseList = await License.find({ userId: userId });
        
        if(licenseList.length > 0){
          await Promise.all(
            licenseList.map(async (license:any) => {
              if(license.uploadId.length > 0){
                license.uploadId.map(async(upload:any) => {
                  deleteUploads(upload);
                })
              }
            })
          );
        }
    
        const response = await License.deleteMany({userId:userId});
        
        return response.ok;
      }
}