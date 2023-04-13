import { StringOrObjectId } from "../common/util";
import { DReport, IReport } from "../models/report-user-model";
import Report from "../schemas/report-user-schema";

export namespace ReportDao {
  const POPULATE_OPTIONS = [
    { path: "reported", select: { firstname: 1, lastname: 1 } },
    { path: "reportedBy", select: { firstname: 1, lastname: 1 } },
  ];
  export async function reportUser(reportDetails: DReport): Promise<IReport> {
    const iReport = new Report(reportDetails);
    let response = await iReport.save();
    return response;
  }

  export async function getAllReportReviews(limit?: number, offset?: number): Promise<IReport[]> {
    const reportList = await Report.find().sort({ createdAt: -1 }).skip(offset).limit(limit).populate(POPULATE_OPTIONS);
    return reportList;
  }

  export async function updateReport(
    userId: string,
    data: Partial<DReport>
  ): Promise<DReport> {
    const updatedReport = await Report.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true }
    ).populate(POPULATE_OPTIONS);
    return updatedReport;
  }

  export async function deleteReportedReviewsByUserId(userId:StringOrObjectId):Promise<number>{
    const response = await Report.deleteMany({reported:userId});
    return response.ok;
  }

  export async function deleteReportedByReviewsByUserId(userId:StringOrObjectId):Promise<number>{
    const response = await Report.deleteMany({reportedBy:userId});
    return response.ok;
  }
}
