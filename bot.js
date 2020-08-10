const path = require('path')
const fs = require('fs')

const config = require('./.config.js')
const Client = require('facebook-messenger-puppeteer')

;(async () => {
  const bot = new Client({
    selfListen: true,

    // Read session if exists
    session: fs.existsSync(path.join(__dirname, '.appstate.json'))
      ? JSON.parse(
        fs.readFileSync(path.join(__dirname, '.appstate.json'), 'utf8')
      )
      : null
  })

  try {
    // Login
    await bot.login(config.facebook_username, config.facebook_password)
  } catch (err) {
    // Login errors
    console.error(`Error: ${err}`)
    process.exit(1)
  }

  // Store session
  fs.writeFileSync(
    path.join(__dirname, '.appstate.json'),
    JSON.stringify(await bot.getSession())
  )

  bot.id = bot.uid
  bot.admins = config.bot_admins
  bot.command_prefix = config.bot_command_prefix

  const _modules = [
    'help',
    'wake-on-lan',
    'rng_range',
    'rng_choice',
    'paiza.io',
    'lmgtfy',
    'life360',
    'permissions',
    'translate',
    'ping',
    'list'
  ]

  const commands = {}
  for (const commandStr of _modules) {
    try {
      commands[commandStr] = require(path.join(
        __dirname,
        'modules',
        commandStr
      ))(bot)
      if (typeof commands[commandStr].name === 'string') {
        commands[commandStr].name = Array(commands[commandStr].name)
      }
    } catch (e) {
      console.error(`Could not load \`${commandStr}.js\``)
      console.log(e)
    }
  }
  bot.commands = commands

  const commandMap = {}
  for (const commandStr in commands) {
    for (const name of commands[commandStr].name) {
      commandMap[name.toLowerCase()] = commands[commandStr]
    }
  }

  bot.commandMap = commandMap
  bot.commandRequiresAdmin = function (commandStr) {
    return commandMap[commandStr].admin
  }
  bot.listen(async message => {
    // Check if the message starts with the command prefix
    if (!message.body.startsWith(config.bot_command_prefix)) return

    // Break down
    const tokens = message.body.split(' ')
    const commandStr = tokens[0]
      .toLowerCase()
      .replace(config.bot_command_prefix.toLowerCase(), '')

    // Check of the command exists
    if (commandStr in commandMap) {
      // Check if the user has permission to run the command
      if (
        bot.commandRequiresAdmin(commandStr) &&
        bot.admins.indexOf(message.sender) === -1
      ) {
        bot.sendMessage(
          message.thread,
          'Error: You do not have permission to execute this command!'
        )
        console.info(`${message.sender} tried to execute \`${commandStr}\``)
        return
      }

      // Try run the command
      try {
        const response = await commandMap[commandStr].function(
          message,
          tokens.slice(1).join(' ')
        )
        if (response) {
          bot.sendMessage(message.thread, response)
        }
        // Catch exception messages
      } catch (err) {
        console.log(err)
        bot.sendMessage(message.thread, `${err}`)
      }
    } else {
      // Command not found!!
    }
  })

  for (const commandStr in commands) {
    if (commands[commandStr].onPreLoad) {
      commands[commandStr].onPreLoad()
    }
  }
  for (const commandStr in commands) {
    if (commands[commandStr].onFinishLoad) {
      commands[commandStr].onFinishLoad()
    }
  }
  console.info('Loading complete')

  // let _restartTime = (new Date().setHours(23, 59, 0, 0) - new Date())
  // if (_restartTime < 0) _restartTime += 1000 * 60 * 60 * 24
  // setTimeout(function () {
  //   console.log('Restarting bot... Time is ' + new Date())
  //   process.exit(137)
  // }, _restartTime)
})()
