

            // translate: {
            //     desc: "Sorry I only speak English",
            //     exec: function(str) {
            //         var doIt = str => translate(str, {
            //             to: 'en'
            //         }).then(res => {
            //             api.sendMessage(
            //                 "`(" + res.from.language.iso + ")` " + str.replace("\n", " ").trim() + "\n" +
            //                 "`(en)` " + res.text.replace("\n", " ").trim(), event.threadID)
            //         }).catch(err => {
            //             console.error(err);
            //         });

            //         if (!str) {
            //             api.getThreadHistory(event.threadID, 20, undefined, (err, history) => {
            //                 message = history.filter(info =>
            //                     info.type === "message" &&
            //                     info.senderID != botID &&
            //                     !info.body.startsWith(_commandprefix) &&
            //                     info.body.replace(/[\x00-\x7E]/g, "").length).pop()
            //                 if (message) {
            //                     doIt(message.body)
            //                 } else {
            //                     api.sendMessage("No recent messages to translate!", event.threadID)
            //                 }
            //             })
            //         } else {
            //             doIt(str)
            //         }

            //     }
            // },
