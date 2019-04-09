module.exports = function(api) {
  return {
    name: ["info"],
    admin: false,
    description: "Get thread information",
    function: async function(messageObj) {
      let info = await api.getThreadInfo(messageObj.threadId);

      // There's nothing interesting in the getThreadInfo function
      return info;

      //   function(err, info) {
      //       if (!err) {
      //           api.sendMessage(
      //               (info.threadName ? ("Thread Name: " + info.threadName + "\n") : "") +
      //               "Thread ID: " + info.threadID + "\n" +
      //               "Message Count: " + info.messageCount, event.threadID);
      //           //info.messageCount
      //       }
      //   })
    }
  };
};
