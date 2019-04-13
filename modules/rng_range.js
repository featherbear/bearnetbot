module.exports = function(api) {
    return {
      name: ["rng"],
      admin: false,
      description: "Consult the mystical RNG!11oneone",
      function: function(messageObj, str) {
        if (!(str=str.trim())) throw Error("No input")
        
        let elems = str.split(" ");
        let lb = Number(elems[0]);
        let ub = Number(elems[1]);
        if (isNaN(lb) || isNaN(ub) || ub < lb) throw Error("Bad range")

        return "RNG has chosen " + (Math.floor(Math.random() * (ub - lb + 1)) + lb) + "!";
      }
    };
};