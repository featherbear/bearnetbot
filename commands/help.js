module.exports = function(api) {
  return {
    name: ["help"],
    admin: false,
    description: "Provides help",
    function: function() {
      let builder = ["Commands","-------------"];
      for (commandStr of Object.keys(api.commandMap).sort()) {
        builder.push(`\`${api.command_prefix}${commandStr}\` - ${api.commandMap[commandStr].description}`)
      }
      return builder.join("\n");
    }
  };
};
