const config = require("./.config.js");
const libfb = require("libfb");
const fs = require("fs");

(async () => {
  let bot = new libfb.Client({
        selfListen: true,
        // Read session if exists
        session: fs.existsSync(__dirname + "/.appstate.json")
          ? JSON.parse(fs.readFileSync(__dirname + "/.appstate.json", "utf8"))
          : undefined
  });
  
  try {
    // Login
    await bot.login(
      config.facebook_username,
      config.facebook_password,
    );
  } catch (err) {
    // Login errors
    let error_title = err.errorData.error_title;
    let error_message = err.errorData.error_message;
    console.error(`Error: ${error_title} - "${error_message}"`);
    process.exit(1);
  }

  // Store session
  fs.writeFileSync(
    __dirname + "/.appstate.json",
    JSON.stringify(bot.getSession())
  );

  bot.id = bot.session.tokens.uid;
  bot.admins = config.bot_admins;
  bot.command_prefix = config.bot_command_prefix;

  let _modules = [
    "help",
    "wake-on-lan",
    "rng_range",
    "rng_choice",
    "info",
    "paiza.io",
    "lmgtfy",
    "life360",
    "permissions",
    "translate"
  ];
  let commands = {};
  for (let commandStr of _modules) {
    try {
      commands[commandStr] = require(__dirname + `/modules/${commandStr}`)(bot);
      if (typeof commands[commandStr].name === "string") {
        commands[commandStr].name = Array(commands[commandStr].name);
      }
    } catch {
      console.error(`Could not load \`${commandStr}.js\``);
    }
  }
  bot.commands = commands;

  let commandMap = {};
  for (let commandStr in commands) {
    for (let name of commands[commandStr].name) {
      commandMap[name.toLowerCase()] = commands[commandStr];
    }
  }

  bot.commandMap = commandMap;
  bot.commandRequiresAdmin = function(commandStr) {
    return commandMap[commandStr].admin;
  };
  bot.on("message", async message => {
    // Check if the message starts with the command prefix
    if (!message.message.startsWith(config.bot_command_prefix)) return;

    // Break down
    let tokens = message.message.split(" ");
    let commandStr = tokens[0]
      .toLowerCase()
      .replace(config.bot_command_prefix.toLowerCase(), "");

    // Check of the command exists
    if (commandStr in commandMap) {
      // Check if the user has permission to run the command
      if (
        bot.commandRequiresAdmin(commandStr) &&
        bot.admins.indexOf(message.authorId) == -1
      ) {
        bot.sendMessage(
          message.threadId,
          "Error: You do not have permission to execute this command!"
        );
        console.info(`${message.authorId} tried to execute \`${commandStr}\``);
        return;
      }

      // Try run the command
      try {
        let response = await commandMap[commandStr].function(
          message,
          tokens.slice(1).join(" ")
        );
        if (response) {
          bot.sendMessage(message.threadId, response);
        }
        // Catch exception messages
      } catch (err) {
        bot.sendMessage(message.threadId, `${err}`);
      }
    } else {
      // Command not found!!
    }
  });

  for (let commandStr in commands) {
    if (commands[commandStr].onFinishLoad) {
      commands[commandStr].onFinishLoad();
    }
  }
  console.info("Loading complete");
  
  let _restartTime = (new Date().setHours(23,59,0,0) - new Date());
  if (_restartTime < 0) _restartTime += 1000*60*60*24;
  setTimeout(function() {
    console.log("Restarting bot... Time is " + new Date());
    process.exit(137);
  }, _restartTime);

})();
