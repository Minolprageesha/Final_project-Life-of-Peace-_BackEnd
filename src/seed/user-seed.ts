import { DUser, UserRole, UserStatus } from "../models/user-model";
import { UserDao } from "../dao/user-dao";

export default async function seedUsers() {
  let userPromises: any[] = [];

  const userList: any[] = [
    {
      password: "111111",
      name: "superadmin",
      email: "admin@deal.com",
      verifiedStatus: UserStatus.VERIFIED,
      role: UserRole.SUPER_ADMIN
    },
  ];

  for (let user of userList) {
    userPromises.push(createUser(user.email, user.name, user.password, user.verifiedStatus, user.role));
  }

  const newUsers = await Promise.all(userPromises);
  return [newUsers];
}


async function createUser(email: string, name: string, password: string, verifiedStatus: string, role: string) {
  const existingUser = await UserDao.getUserByEmail(email);

  if (existingUser) {
    return existingUser;
  }

  return await UserDao.signUpWithEmail(email, name, password, verifiedStatus, role);
}
