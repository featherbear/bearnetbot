module.exports = function(api) {
  return {
    name: ["info"],
    admin: false,
    description: "Get thread information",
    function: async function(messageObj) {
      let info = await api.getThreadInfo(messageObj.threadId);

      // There's nothing interesting in the getThreadInfo function
      return [
        "Thread Information",
        "-----------",
        `ID: ${info.id}`,
        `Name: ${info.name || "<not available>"}`,
        `Members: ${info.participants.length}`,
        `Message Count: ${"<not available>"}`
      ].join("\n");
    }
  };
};
