import { Types } from "mongoose";
import { StringOrObjectId } from "../common/util";
import { DEducation, IEducation } from "../models/education-model";
import Education from "../schemas/education-schema";

export namespace EducationDao {
  export async function getEducationalDetailsByUserId(
    userId: any
  ): Promise<IEducation[]> {
    const response = await Education.find({ userId: userId }).populate([
      { path: "uploadId" },
    ]);
    return response;
  }

  export async function getEducationalDetailsById(
    id: Types.ObjectId
  ): Promise<IEducation> {
    const response = await Education.findById(id);
    return response;
  }

  export async function updateEducationalDetails(
    id: Types.ObjectId,
    newEducationalDetails: DEducation
  ): Promise<IEducation> {
    const response = await Education.findByIdAndUpdate(
      id,
      newEducationalDetails,
      { new: true }
    );
    return response;
  }

  export async function deleteEducationDetailsById(
    id: Types.ObjectId
  ): Promise<IEducation> {
    const response = await Education.findByIdAndDelete(id).select({password: 0});
    return response;
  }

  export async function deleteEducationDetailsByTherapistId(
    userId: StringOrObjectId,
    deleteUploads : (value: StringOrObjectId) => Promise<boolean>
  ): Promise<number> {
    const educationList = await Education.find({ userId: userId });
    
    if (educationList.length > 0){
      await Promise.all(
        educationList.map(async (qualification: any) => {
          if (qualification.uploadId.length > 0){
            qualification.uploadId.map(async(upload: any) => {
              deleteUploads(upload);
            })
          }
        })
      );
    }

    const response = await Education.deleteMany({userId: userId});
    
    return response.ok;
  }
}
