import U from "../scripts/utilities.js";

enum UserTargetRef {
  gm = "gm", // The alert is shown to the GM.
  self = "self", // The alert is shown to the current user.
  all = "all", // The alert is shown to all connected users.
  players = "players", // The alert is shown to all users except the GM.
  other = "other", // The alert is shown to all users except the current user.
  otherPlayers = "otherPlayers" // The alert is shown to all users except the current user and the GM.
}

type K4UserTarget = UserTargetRef|IDString|UUIDString;

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class K4Socket {


// #region ░░░░░░░[SocketLib]░░░░ SocketLib Initialization ░░░░░░░ ~

// #endregion ░░░░[SocketLib]░░░░

  private static SocketFunctions: Record<string, SocketFunction> = {};

  static RegisterSocketFunctions(funcs: Record<string, SocketFunction>) {
    for (const [fName, func] of Object.entries(funcs)) {
      socketlib.system.register(fName, func);
      K4Socket.SocketFunctions[fName] = func;
    }
  }

  static GetUsers(target: Maybe<K4UserTarget>): User[] {
    const selfUser = getUser();
    if (!target) { return [selfUser]; }
    if (U.isDocID(target)) {
      return [getGame().users.get(target) ?? undefined]
        .filter((user: Maybe<User>) => user?.active) as User[];
    } else if (U.isDocUUID(target)) {
      return [(fromUuidSync(target) ?? undefined) as Maybe<User>]
        .filter((user: Maybe<User>) => user?.active) as User[];
    }
    const allUsers = getGame().users.contents
      .filter((user: Maybe<User>) => user?.active) as User[];
    const [
      gmUsers,
      playerUsers
    ] = U.partition<User>(allUsers, (user: User) => user.isGM);
    switch (target) {
      case UserTargetRef.all: return allUsers;
      case UserTargetRef.gm: return gmUsers;
      case UserTargetRef.other: return allUsers.filter((user) => user.id !== selfUser.id);
      case UserTargetRef.otherPlayers: return playerUsers.filter((user) => user.id !== selfUser.id);
      case UserTargetRef.players: return playerUsers;
      case UserTargetRef.self: return [selfUser];
    }
  }

  static async Call<RT = void>(funcName: string, targetUser: K4UserTarget, ...funcParameters: unknown[]): Promise<RT[]> {
    if (!(funcName in K4Socket.SocketFunctions)) {
      throw new Error(`[K4Socket.Call] No Such Function Registered: ${funcName}`);
    }
    const userTargets = this.GetUsers(targetUser);
    const func = K4Socket.SocketFunctions[funcName] as SocketFunction & AsyncFunc<RT>;

    return Promise.all(userTargets.map((user: User) => {
      return socketlib.system.executeAsUser(
        func,
        user.id!,
        ...funcParameters
      );
    }));
  }
}

export default K4Socket;

export {UserTargetRef}