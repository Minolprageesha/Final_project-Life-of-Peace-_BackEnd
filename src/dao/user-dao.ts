import { AppLogger } from "../common/logging";
import { ApplicationError } from "../common/application-error";
import { DUser, IUser, UserRole, UserStatus } from "../models/user-model";
import User from "../schemas/user-schema";
import { StringOrObjectId, Util } from "../common/util";
import { EmailService } from "../mail/config";
import { ITherapist } from "../models/therapist-model";
import { Types } from "mongoose";
import { DAdmin } from "../models/admin-model";
import { DContact, IContact } from "../models/contact-us-model";
import Contact from "../schemas/contact-us-schema";
import { IEducation } from "../models/education-model";
import { ILicense } from "../models/license-model";
import Education from "../schemas/education-schema";
import License from "../schemas/license-schema";
import { DCustomerReview, ICustomerReview } from "../models/customer-reviews-model";
import CustomerReview from "../schemas/customer-reviews-schema";
import { DClient, IClient } from "../models/client-model";

export namespace UserDao {
  export async function authenticateUser(email: string, password: string): Promise<string> {
    const user = await getUserByEmail(email);
    if (user) {
      const isMatch = await user.comparePassword(password);
      let verificationCode = null;
      if (!isMatch) {
        throw new ApplicationError("Incorrect email/password combination.");
      }
      if (user?.verifiedStatus == UserStatus.PENDING) {
        let code = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
        verificationCode = code.toString();

        const updatedUser: any = {
          verificationCode: await Util.passwordHashing(verificationCode),
        };

        let userWithVerificationCode = await UserDao.updateUser(user._id, updatedUser);

        if (!userWithVerificationCode) {
          throw new ApplicationError("Something went wrong with verification code.");
        }

        // await EmailService.sendVerifyEmail(
        //   user,
        //   "Pencil my deal - Verify your email.",
        //   verificationCode,
        //   "Thank you for signing up with Pencil my deal!",
        //   "To proceed with your account you have to verify your email. Please enter the following OTP in the verify section."
        // );
      }
      return user.createAccessToken();
    } else {
      throw new ApplicationError("User not found in the system.");
    }
  }

  export async function deleteUserById(
    userId: StringOrObjectId,
    deleteUploads: (value: StringOrObjectId) => Promise<boolean>
  ): Promise<IUser> {
    const user: any = await User.findById(userId);

    if (user?.coverPhotoId?.category !== "THEMES") {
      await deleteUploads(user?.coverPhotoId);
    }

    if (user?.photoId) {
      await deleteUploads(user?.photoId);
    }

    if (user?.photoThambnailId) {
      await deleteUploads(user?.photoThambnailId);
    }
    const response = await User.findByIdAndDelete(userId);

    return response;
  }

  export async function getUserById(id: StringOrObjectId): Promise<IUser> {
    let user: IUser = await User.findById(id)
      .populate([
        { path: "photoId" },
        { path: "experiencedIn" },
      ])
      .select({ password: 0 });
    if (!user) {
      throw new ApplicationError("User not found for Id: " + id);
    }

    AppLogger.info(`Got user for id, userID: ${user._id}`);
    user.lastLogin = new Date();
    await user.save();
    return user;
  }

  export async function getUserByIdTest(id: StringOrObjectId): Promise<IUser> {
    let user: IUser = await User.findById(id).populate("photo");
    if (!user) {
      throw new ApplicationError("User not found for Id: " + id);
    }

    AppLogger.info(`Got user for id, userID: ${user._id}`);
    user.lastLogin = new Date();
    await user.save();
    return user;
  }

  export async function getUserByIdNotPopulated(id: StringOrObjectId): Promise<IUser> {
    let user: IUser = await User.findById(id)
      .select({ password: 0 });
    if (!user) {
      throw new ApplicationError("User not found for Id: " + id);
    }

    AppLogger.info(`Got user for id, userID: ${user._id}`);
    user.lastLogin = new Date();
    await user.save();
    return user;
  }

  export async function updateUser(id: StringOrObjectId, data: Partial<DUser>): Promise<IUser> {
    let user = await User.findByIdAndUpdate(id, { $set: data }, { new: true }).select({ password: 0 }).populate([
      { path: "photoId" },
      { path: "experiencedIn" },

    ]);
    return user;
  }

  export async function getUserByEmail(email: string): Promise<IUser | ITherapist | null> {
    let user = await User.findOne(
      { email: email }
    );
    return user;
  }

  export async function unSetField(userId: Types.ObjectId, _fieldName?: string): Promise<any> {
    const response = await User.findByIdAndUpdate(
      userId,
      {
        $unset: { verificationCode: "" },
      },
      { new: true }
    );
    return response;
  }

  export async function getUserByPrimaryPhone(phone: string): Promise<IUser | null> {
    let user = await User.findOne({ primaryPhone: phone });
    return user;
  }

  export async function getUserByUserId(id: StringOrObjectId): Promise<IUser> {
    let user: IUser = await User.findById(id)
      .populate([
        { path: "qualifications" },
        { path: "experiencedIn" },
        { path: "professionLicense" },
        { path: "qualifications", populate: { path: "uploadId" } },
        { path: "photoId" },
        { path: "licenseId" },
        { path: "licenseId", populate: { path: "uploadId" } },
      ])
      .select({ password: 0 });
    return user;
  }
  export async function signUpWithEmail(
    email: string,
    name: string,
    password: string,
    verifiedStatus: string,
    role: string,

  ): Promise<IUser> {

    let isEmailUsed = await User.findOne({ email: email });
    if (isEmailUsed) {
      throw new ApplicationError("Provided email is already taken.");
    }
    let userDetails: DAdmin = null;

    if (role == UserRole.SUPER_ADMIN) {
      userDetails = {
        email: email,
        name: name,
        password: password,
        verifiedStatus: verifiedStatus,
        role: role,
      };
    }
    try {
      const user = new User(userDetails);
      console.log(user);
      const newUser = await user.save();
      return newUser;
    }
    catch (err) {
      console.log('errrr', err)
    }
  }

  export async function signUpWithUsers(
    email: string,
    primaryPhone: string,
    password: string,
    role: string,
    roleType: string,
    verifiedStatus?: string
  ): Promise<IUser> {

    let isEmailUsed = await User.findOne({ email: email });
    if (isEmailUsed) {
      throw new ApplicationError("Provided email is already taken.");
    }
    let userDetails: any = null;

    if (role == UserRole.THERAPIST) {
      userDetails = {
        email: email,
        primaryPhone: primaryPhone,
        password: password,
        role: role,
        roleType: roleType,
        photoId: null,
        verifiedStatus: verifiedStatus ? verifiedStatus : UserStatus.PENDING,
        adminApproved: false,
        blockedByAdmin: false,
      };
    }

    if (role == UserRole.CLIENT) {
      userDetails = {
        email: email,
        primaryPhone: primaryPhone,
        password: password,
        role: role,
        photoId: null,
        verifiedStatus: verifiedStatus ? verifiedStatus : UserStatus.PENDING,
        adminApproved: true,
        blockedByAdmin: false,
      };
    }
    try {
      const user = new User(userDetails);
      console.log(user);
      const newUser = await user.save();
      return newUser;
    }
    catch (err) {
      console.log('errrr', err)
    }
  }

  export async function signUpWithClient(
    email: string,
    primaryPhone: string,
    password: string,
    role: string,
    depressLevel?: string,
    depressCount?: number,
    gender?: string,
    dateOfBirth?: Date,
    verifiedStatus?: string
  ): Promise<IUser> {

    let isEmailUsed = await User.findOne({ email: email });
    if (isEmailUsed) {
      throw new ApplicationError("Provided email is already taken.");
    }
    let userDetails: DClient = null;

    if (role == UserRole.CLIENT) {
      userDetails = {
        email: email,
        primaryPhone: primaryPhone,
        password: password,
        role: role,
        depressLevel: depressLevel,
        depressCount: depressCount,
        gender: gender,
        dateOfBirth: dateOfBirth,
        photoId: null,
        verifiedStatus: verifiedStatus ? verifiedStatus : UserStatus.PENDING,
        adminApproved: true,
        blockedByAdmin: false,
      };
    }
    try {
      const user = new User(userDetails);
      console.log(user);
      const newUser = await user.save();
      return newUser;
    }
    catch (err) {
      console.log('errrr', err)
    }
  }




  export async function contactRequest(contactDetails: DContact): Promise<IContact> {
    const request = new Contact(contactDetails);
    let response = await request.save();
    return response;
  }


  export async function customerReviewDao(cusReview: DCustomerReview): Promise<ICustomerReview> {
    const request = new CustomerReview(cusReview);
    let response = await request.save();
    return response;
  }


  export async function addEducationalInfo(details: any): Promise<IEducation> {
    const educationDetails = new Education(details);
    let response = await educationDetails.save();

    if (response) {
      let updatedTherapist = await User.findByIdAndUpdate(response.userId, { $push: { qualifications: response._id } }, { new: true });
    }

    return response;
  }

  export async function addLicenseInfo(details: any): Promise<ILicense> {
    const licenseDetails = new License(details);
    let response = await licenseDetails.save();

    if (response) {
      let updatedTherapist = await User.findByIdAndUpdate(response.userId, { $push: { licenseId: response._id } }, { new: true });
    }

    return response;
  }

  export async function updateRequestByUserId(userId: Types.ObjectId, requestId: Types.ObjectId): Promise<ITherapist | IClient> {
    let response = await User.findByIdAndUpdate(
      userId,
      {
        $push: { friendRequests: requestId },
      },
      { new: true }
    );
    return response;
  }
}

