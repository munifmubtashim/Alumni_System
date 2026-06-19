import { UserDTO, UserQuery } from "@alumni/dal";

export class UserManager {
  userQuery: UserQuery;

  constructor() {
    this.userQuery = new UserQuery();
  }

  public async createUser(user: UserDTO) {
    const newUser = await this.userQuery.createUser(user);
    return newUser;
  }

  public async findUserByEmail(email: string) {
    const user = await this.userQuery.findUserByEmail(email);
    return user;
  }

  public async findUserById(id: number) {
    const user = await this.userQuery.findUserById(id);
    return user;
  }

  public async updateUser(id: number, user: Partial<UserDTO>) {
    const updatedUser = await this.userQuery.updateUser(id, user);
    return updatedUser;
  }

  public async getAllUsers() {
    const allUsers = await this.userQuery.getAllUsers();
    return allUsers;
  }

  public async deleteUser(id: number) {
    const deletedUser = await this.userQuery.deleteUser(id);
    return deletedUser;
  }

  public async updateLoginTime(id: number) {
    await this.userQuery.updateLoginTime(id);
  }

  public async updateLogoutTime(id: number) {
    await this.userQuery.updateLogoutTime(id);
  }
}
