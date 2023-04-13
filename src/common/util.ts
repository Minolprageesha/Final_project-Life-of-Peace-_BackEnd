import { NextFunction, Request, Response } from "express";
import * as mongoose from "mongoose";
import * as bcrypt from "bcryptjs";
import { Types } from "mongoose";
import moment = require("moment");
import { DTherapist } from "../models/therapist-model";

export type ObjectIdOr<T extends mongoose.Document> = mongoose.Types.ObjectId | T;

export type StringOrObjectId = string | mongoose.Types.ObjectId;

export namespace Util {
  export function withErrorHandling(requestHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return function updateProject(req: Request, res: Response, next: NextFunction) {
      requestHandler(req, res, next).catch(next);
    };
  }

  export async function passwordHashing(password: string): Promise<any> {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  }

  export async function getLastDayOfMonth(year: number, month: number): Promise<any> {
    return new Date(year, month + 1, 0).getDate();
  }

  export function isObjectId(v: string): boolean {
    return mongoose.Types.ObjectId.isValid(v) && Types.ObjectId(v).toHexString() === v;
  }

  export function getStateByZipCode(zipString: string) {
    if (typeof zipString !== "string") {
      console.log("Must pass the zipcode as a string.");
      return;
    }

    if (zipString.length !== 5) {
      console.log("Must pass a 5-digit zipcode.");
      return;
    }

    const zipcode = parseInt(zipString, 10);

    let state;

    if (zipcode >= 35000 && zipcode <= 36999) {
      state = "Alabama";
    } else if (zipcode >= 99500 && zipcode <= 99999) {
      state = "Alaska";
    } else if (zipcode >= 85000 && zipcode <= 86999) {
      state = "Arizona";
    } else if (zipcode >= 71600 && zipcode <= 72999) {
      state = "Arkansas";
    } else if (zipcode >= 90000 && zipcode <= 96699) {
      state = "California";
    } else if (zipcode >= 80000 && zipcode <= 81999) {
      state = "Colorado";
    } else if ((zipcode >= 6000 && zipcode <= 6389) || (zipcode >= 6391 && zipcode <= 6999)) {
      state = "Connecticut";
    } else if (zipcode >= 19700 && zipcode <= 19999) {
      state = "Delaware";
    } else if (zipcode >= 32000 && zipcode <= 34999) {
      state = "Florida";
    } else if ((zipcode >= 30000 && zipcode <= 31999) || (zipcode >= 39800 && zipcode <= 39999)) {
      state = "Georgia";
    } else if (zipcode >= 96700 && zipcode <= 96999) {
      state = "Hawaii";
    } else if (zipcode >= 83200 && zipcode <= 83999) {
      state = "Idaho";
    } else if (zipcode >= 60000 && zipcode <= 62999) {
      state = "Illinois";
    } else if (zipcode >= 46000 && zipcode <= 47999) {
      state = "Indiana";
    } else if (zipcode >= 50000 && zipcode <= 52999) {
      state = "Iowa";
    } else if (zipcode >= 66000 && zipcode <= 67999) {
      state = "Kansas";
    } else if (zipcode >= 40000 && zipcode <= 42999) {
      state = "Kentucky";
    } else if (zipcode >= 70000 && zipcode <= 71599) {
      state = "Louisiana";
    } else if (zipcode >= 3900 && zipcode <= 4999) {
      state = "Maine";
    } else if (zipcode >= 20600 && zipcode <= 21999) {
      state = "Maryland";
    } else if ((zipcode >= 1000 && zipcode <= 2799) || zipcode == 5501 || zipcode == 5544) {
      state = "Massachusetts";
    } else if (zipcode >= 48000 && zipcode <= 49999) {
      state = "Michigan";
    } else if (zipcode >= 55000 && zipcode <= 56899) {
      state = "Minnesota";
    } else if (zipcode >= 38600 && zipcode <= 39999) {
      state = "Mississippi";
    } else if (zipcode >= 63000 && zipcode <= 65999) {
      state = "Missouri";
    } else if (zipcode >= 59000 && zipcode <= 59999) {
      state = "Montana";
    } else if (zipcode >= 27000 && zipcode <= 28999) {
      state = "North Carolina";
    } else if (zipcode >= 58000 && zipcode <= 58999) {
      state = "North Dakota";
    } else if (zipcode >= 68000 && zipcode <= 69999) {
      state = "Nebraska";
    } else if (zipcode >= 88900 && zipcode <= 89999) {
      state = "Nevada";
    } else if (zipcode >= 3000 && zipcode <= 3899) {
      state = "New Hampshire";
    } else if (zipcode >= 7000 && zipcode <= 8999) {
      state = "New Jersey";
    } else if (zipcode >= 87000 && zipcode <= 88499) {
      state = "New Mexico";
    } else if ((zipcode >= 10000 && zipcode <= 14999) || zipcode == 6390 || zipcode == 501 || zipcode == 544) {
      state = "New York";
    } else if (zipcode >= 43000 && zipcode <= 45999) {
      state = "Ohio";
    } else if ((zipcode >= 73000 && zipcode <= 73199) || (zipcode >= 73400 && zipcode <= 74999)) {
      state = "Oklahoma";
    } else if (zipcode >= 97000 && zipcode <= 97999) {
      state = "Oregon";
    } else if (zipcode >= 15000 && zipcode <= 19699) {
      state = "Pennsylvania";
    } else if (zipcode >= 300 && zipcode <= 999) {
      state = "Puerto Rico";
    } else if (zipcode >= 2800 && zipcode <= 2999) {
      state = "Rhode Island";
    } else if (zipcode >= 29000 && zipcode <= 29999) {
      state = "South Carolina";
    } else if (zipcode >= 57000 && zipcode <= 57999) {
      state = "South Dakota";
    } else if (zipcode >= 37000 && zipcode <= 38599) {
      state = "Tennessee";
    } else if ((zipcode >= 75000 && zipcode <= 79999) || (zipcode >= 73301 && zipcode <= 73399) || (zipcode >= 88500 && zipcode <= 88599)) {
      state = "Texas";
    } else if (zipcode >= 84000 && zipcode <= 84999) {
      state = "Utah";
    } else if (zipcode >= 5000 && zipcode <= 5999) {
      state = "Vermont";
    } else if ((zipcode >= 20100 && zipcode <= 20199) || (zipcode >= 22000 && zipcode <= 24699) || zipcode == 20598) {
      state = "Virginia";
    } else if ((zipcode >= 20000 && zipcode <= 20099) || (zipcode >= 20200 && zipcode <= 20599) || (zipcode >= 56900 && zipcode <= 56999)) {
      state = "Washington DC";
    } else if (zipcode >= 98000 && zipcode <= 99499) {
      state = "Washington";
    } else if (zipcode >= 24700 && zipcode <= 26999) {
      state = "West Virginia";
    } else if (zipcode >= 53000 && zipcode <= 54999) {
      state = "Wisconsin";
    } else if (zipcode >= 82000 && zipcode <= 83199) {
      state = "Wyoming";
    } else {
      state = "";
      console.log("No state found matching", zipcode);
    }

    return state;
  }

  export async function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min) + min);
  }

  export function calculateWeekNumberAndDates(date: any, clientId: string, therapistId: string, appointmentId?: string) {
    const startOfWeek = moment(date).startOf("week").toDate();
    const endOfWeek = moment(date).endOf("week").toDate();

    const result = {
      clientId: clientId,
      therapistId: therapistId,
      appointmentId: appointmentId,
      selectedDate: date,
      startOfWeek: startOfWeek,
      endOfWeek: endOfWeek,
    };

    return result;
  }

  export function calculate21Days(date: any, clientId: string, therapistId: string, appointmentId?: string) {
    const startOfMonth = moment(date).startOf("week").toDate();
    const endOf21Days = moment(date).add(21, "days").toDate();

    const result = {
      clientId: clientId,
      therapistId: therapistId,
      appointmentId: appointmentId,
      selectedDate: date,
      startOfWeek: startOfMonth,
      endOfWeek: endOf21Days,
    };

    return result;
  }

  export function getMeetingTimeDuration(sTime: string, eTime: string) {
    const startTime = moment(sTime, "HH:mm:ss a");
    const endTime = moment(eTime, "HH:mm:ss a");
    const duration = moment.duration(endTime.diff(startTime));
    const minutes = parseInt(duration.asMinutes().toString());

    return minutes;
  }

  export function getAvailableTimeBySelectedDay(day: string, therapist: DTherapist) {
    const availableHours: string[] = [];

    if (therapist?.workingHours?.length) {
      therapist?.workingHours
        ?.filter((obj) => obj.day === day)
        .map((obj: any) => {
          const startTime = parseInt(obj.beginTime);
          const endTime = parseInt(obj.endTime);

          for (let hour = startTime; hour <= endTime; hour++) {
            availableHours.push(moment.utc({ hour }).format("H:mm A"));

            if (hour != endTime) {
              availableHours.push(
                moment
                  .utc({
                    hour,
                    minute: 30,
                  })
                  .format("H:mm A")
              );
            }
          }
        });
    }

    return availableHours;
  }

}
