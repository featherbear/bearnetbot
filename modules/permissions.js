const fs = require("fs");

class PermissionManager {
  constructor() {
    this.perms = {};
    this.filePath = null;
  }

  load(file) {
    this.perms = fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, "utf8"))
      : {};
    this.filePath = file;
  }

  write(file) {
    if (!file && !this.filePath) throw Error("No file path specified");
    file = file || this.filePath;
    fs.writeFileSync(file, JSON.stringify(this.perms));
  }

  _touchUser(userID) {
    if (!(userID in this.perms)) this.perms[userID] = {};
  }

  allow(userID, commandStr) {
    this._touchUser(userID);
    this.perms[userID][commandStr] = true;
  }

  revoke(userID, commandStr) {
    this._touchUser(userID);
    this.perms[userID][commandStr] = false;
  }

  unset(userID, commandStr) {
    this._touchUser(userID);
    delete this.perms[userID][commandStr];
  }

  view(userID) {
    this._touchUser(userID);
    return this.perms[userID];
  }

  check(userID, commandStr) {
    return this.view(userID)[commandStr];
  }

  dump() {
    return this.perms;
  }
}

PermissionManager = new PermissionManager();
PermissionManager.load(__dirname + "/../" + ".permissions.json");

module.exports = function(api) {
  const permissionsFunctionWrapper = function(func) {
    return async function(messageObj) {
      let commandStr = messageObj.message
        .split(" ")[0]
        .toLowerCase()
        .replace(api.command_prefix.toLowerCase(), "");
      let check = (() => {
        let check = PermissionManager.check(messageObj.authorId, commandStr);
        if (check == true) return true;
        if (check == undefined) {
          if (api.commandMap[commandStr]._admin == false) return true;
          if (api.admins.indexOf(messageObj.authorId) > -1) return true;
        }
        return false;
      })();

      if (!check)
        throw Error("You do not have permission to execute this command!");
      return await func(...arguments);
    };
  };

  api.commandRequiresAdmin = function(commandStr) {
    return api.commandMap[commandStr]._admin;
  };

  const resolveUser = async function(threadId, userStr) {
    let threadInfo = await api.getThreadInfo(threadId);
    if (userStr[0] == "@") userStr = userStr.slice(1);

    // TODO: Nickname functionality - but the API doesn't seem to work

    let matches = [];
    for (let user of threadInfo.participants) {
      if (
        Number(user.id) == Number(userStr) ||
        String(user.name)
          .toLowerCase()
          .indexOf(userStr.toLowerCase()) > -1
      )
        matches.push(user);
    }

    if (matches.length == 0)
      throw Error(`No users matching '${userStr}' found!`);
    if (matches.length > 1)
      throw [
        `More than one users matched '${userStr}'`,
        "Please use a more concise user string",
        "",
        ...matches.map(user => `${user.name} - ${user.id}`)
      ].join("\n");

    return matches[0].id;
  };

  funcs = {
    list: function() {
      return [
        "Availabe command permission strings:",
        ...Object.keys(api.commandMap).sort()
      ].join("\n");
    },

    check: async function(messageObj, userStr) {
      if (!userStr) throw Error("Invalid arguments");
      let userID = await resolveUser(messageObj.threadId, userStr);

      let permissions = PermissionManager.view(userID);
      if (Object.keys(permissions).length == 0) {
        return `User ${userID} has no custom permissions`;
      }

      let _permissions = [];
      for (let permission of Object.keys(permissions).sort()) {
        _permissions.push(
          `${permissions[permission] ? "+" : "-"} ${permission}`
        );
      }
      return [`User ${userID} has the permissions:`, ..._permissions].join(
        "\n"
      );
    },

    allow: async function(messageObj, userStr, permission) {
      if (!userStr || !permission) throw Error("Invalid arguments");
      let userID = await resolveUser(messageObj.threadId, userStr);

      PermissionManager.allow(userID, permission);
      PermissionManager.write();
      return `User ${userID} given permission \`${permission}\``;
    },

    revoke: async function(messageObj, userStr, permission) {
      if (!userStr || !permission) throw Error("Invalid arguments");
      let userID = await resolveUser(messageObj.threadId, userStr);

      PermissionManager.revoke(userID, permission);
      PermissionManager.write();
      return `User ${userID} revoked permission \`${permission}\``;
    },

    unset: async function(messageObj, userStr, permission) {
      if (!userStr || !permission) throw Error("Invalid arguments");
      let userID = await resolveUser(messageObj.threadId, userStr);

      PermissionManager.unset(userID, permission);
      PermissionManager.write();
      return `Permission \`${permission}\` reset for user ${userID}`;
    }
  };

  return {
    name: ["perm", "permissions"],
    admin: true,
    description: "Provides help",

    function: async function(messageObj, args) {
      args = args.split(" ");
      if (args.length == 0 || Object.keys(this.funcs).indexOf(args[0]) == -1) {
        return [
          "Permissions Commands",
          "----------------",
          "`list`",
          "`check` <name>",
          "`allow` <name> <command>",
          "`revoke` <name> <command>",
          "`unset` <name> <command>",
          "----------------"
        ].join("\n");
      }

      let command = args[0];
      let nameStr = args.slice(1, -1).join(" ");
      let permission = args.slice(-1);

      return await this.funcs[command](messageObj, nameStr, permission);
    },
    onFinishLoad: function() {
      // Set wrapper
      for (let commandStr in api.commandMap) {
        api.commandMap[commandStr].function = permissionsFunctionWrapper(
          api.commandMap[commandStr].function
        );
        api.commandMap[commandStr]._admin =
          api.commandMap[commandStr].admin || false;
        api.commandMap[commandStr].admin = false;
      }
    }
  };
};
