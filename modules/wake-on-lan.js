const wol = require("node-wol");
const config = {
  MAC: "11:AA:22:BB:33:CC",
  address: "somehostnameoripaddress",
  port: 9
};
module.exports = function(api) {
  return {
    name: ["wol"],
    admin: true,
    description: "Send a Wake-On-LAN Magic Packet",
    function: async function() {
      return new Promise(function(resolve, reject) {
        wol.wake(
          config.MAC,
          {
            address: config.address,
            port: config.port
          },
          err => (err ? reject(err) : resolve("Sent WOL Magic Packet"))
        );
      });
    }
  };
};
