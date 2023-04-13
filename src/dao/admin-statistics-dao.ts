import { UserStatus } from "../models/user-model";
import Client from "../schemas/client-schema";
import Therapist from '../schemas/therapist-schema';

export namespace AdminStatisticsDao {
    export async function getAllClientCount(): Promise<number> {
        const client = await Client.find();
        return client.length;
    }

    export async function getAllPendingClientCount(): Promise<number> {
        const client = await Client.find({verifiedStatus: UserStatus.PENDING}, { new: true });
        return client.length;
    }

    export async function getAllTherapistCount(): Promise<number> {
        const therapist = await Therapist.find();
        return therapist.length;
    }


}