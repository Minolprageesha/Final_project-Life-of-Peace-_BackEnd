import { Types } from "mongoose";
import { StringOrObjectId } from "../common/util";
import { IClient, DClient } from "../models/client-model";
import Client from "../schemas/client-schema";

export namespace ClientDao {
  const populateOptions = [
    {
      path: "photoId",
    },
    {
      path: "clientId",
    },
  ];
  export async function getUserById(id: StringOrObjectId): Promise<IClient> {
    let user: IClient = await Client.findById(id)
      .populate(populateOptions)
      .select({ password: 0 });

    return user;
  }

  export async function updateClient(
    id: StringOrObjectId,
    data: Partial<DClient>
  ): Promise<IClient> {
    let client = await Client.findByIdAndUpdate(
      { _id: id },
      { $set: data },
      { new: true }
    );

    return client;
  }

  export async function updateClientInvoiceList(
    clientId: Types.ObjectId,
    invoiceId: Types.ObjectId
  ): Promise<boolean> {
    const updatedClient = await Client.findByIdAndUpdate(
      clientId,
      {
        $push: { invoices: invoiceId },
      },
      { new: true }
    );

    if (updatedClient) {
      return true;
    }

    return false;
  }
}
