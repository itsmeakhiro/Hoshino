// Disclaimer: This function may / has to be in beta version. So please do not intent to modify this file as this is an replica version of Francis Loyd Raval. Do not MODIFY this if you dont want to global ban you to the website and its bot functionality. This part is where the tokito has access to become a API

const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const listener = require("./system/listener").default;

const allResolve = new Map();
const replyCallbacks = new Map(); // Store callbacks for replies

router.get("/postWReply", async (req, res) => {
  if (!req.query.senderID) {
    res.json({
      result: {
        body: "❌ Please Enter your senderID on query. it allows any identifiers, please open your code.",
      },
      status: "success",
    });
    return;
  }
  const event = new Event(req.query ?? {});
  event.messageID = `id_${crypto.randomUUID()}`;

  // Check if this event is a reply to a bot's message
  if (event.messageReply && replyCallbacks.has(event.messageReply.messageID)) {
    const callback = replyCallbacks.get(event.messageReply.messageID);
    if (callback) {
      const ctx = {
        chat: event.threadID,
        api: createApiProxy(event, null), // Create a new API proxy for the reply
        event,
      };
      try {
        await callback(ctx);
      } catch (error) {
        console.error("Error in reply callback:", error);
      }
    }
  }

  const botResponse = await new Promise(async (resolve) => {
    allResolve.set(event.messageID, resolve);
    const apiFake = new Proxy(
      {
        sendMessage(form, _threadID, third) {
          const nform = normalizeMessageForm(form);
          const messageID = `id_${crypto.randomUUID()}`;
          const ll = {
            result: {
              body: nform.body,
              messageID,
              timestamp: Date.now().toString(),
            },
            status: "success",
            addReply: (callback) => {
              // Store the reply callback for this message
              replyCallbacks.set(messageID, callback);
            },
          };
          resolve(ll);
          if (typeof third === "function") {
            try {
              third(ll);
            } catch (error) {
              console.error(error);
            }
          }
        },
      },
      {
        get(target, prop) {
          if (prop in target) {
            return target[prop];
          }
          return (...args) => {
            console.log(
              `Warn: 
    api.${String(prop)}(${args
                .map((i) => `[ ${typeof i} ${i?.constructor?.name || ""} ]`)
                .join(",")}) has no effect!`
            );
          };
        },
      }
    );
    try {
      await listener({ api: apiFake, event });
    } catch (error) {
      console.error(error);
    }
  });

  res.json(botResponse);
});

const pref = "web:";

function formatIP(ip) {
  try {
    ip = ip?.replaceAll("custom_", "");
    const formattedIP = ip;
    return `${pref}${formattedIP}`;
  } catch (error) {
    console.error("Error in formatting IP:", error);
    return ip;
  }
}

class Event {
  constructor({ ...info } = {}) {
    this.messageID = undefined;

    let defaults = {
      body: "",
      senderID: "0",
      threadID: "0",
      messageID: "0",
      type: "message",
      timestamp: Date.now().toString(),
      isGroup: false,
      participantIDs: [],
      attachments: [],
      mentions: {},
      isWeb: true,
    };
    Object.assign(this, defaults, info);
    if (this.userID && this.isWeb) {
      this.userID = formatIP(this.senderID);
    }
    this.senderID = formatIP(this.senderID);
    this.threadID = formatIP(this.threadID);
    if (
      "messageReply" in this &&
      typeof this.messageReply === "object" &&
      this.messageReply
    ) {
      this.messageReply.senderID = formatIP(this.messageReply.senderID);
    }
    this.participantIDs ??= [];
    if (Array.isArray(this.participantIDs)) {
      this.participantIDs = this.participantIDs.map((id) => formatIP(id));
    }

    if (Object.keys(this.mentions ?? {}).length > 0) {
      this.mentions = Object.fromEntries(
        Object.entries(this.mentions).map((i) => [formatIP(i[0]), i[1]])
      );
    }
  }
}

function normalizeMessageForm(form) {
  let r = {};
  if (form && r) {
    if (typeof form === "object") {
      r = form;
    }
    if (typeof form === "string") {
      r = {
        body: form,
      };
    }
    if (!Array.isArray(r.attachment) && r.attachment) {
      r.attachment = [r.attachment];
    }
    return r;
  } else {
    return {
      body: undefined,
    };
  }
}

// Helper function to create API proxy for reply context
function createApiProxy(event, resolve) {
  return new Proxy(
    {
      sendMessage(form, _threadID, third) {
        const nform = normalizeMessageForm(form);
        const ll = {
          result: {
            body: nform.body,
            messageID: `id_${crypto.randomUUID()}`,
            timestamp: Date.now().toString(),
          },
          status: "success",
        };
        if (resolve) {
          resolve(ll);
        }
        if (typeof third === "function") {
          try {
            third(ll);
          } catch (error) {
            console.error(error);
          }
        }
        return ll;
      },
    },
    {
      get(target, prop) {
        if (prop in target) {
          return target[prop];
        }
        return (...args) => {
          console.log(
            `Warn: 
    api.${String(prop)}(${args
              .map((i) => `[ ${typeof i} ${i?.constructor?.name || ""} ]`)
              .join(",")}) has no effect!`
          );
        };
      },
    }
  );
}

module.exports = router;

// Developed by: Liane Cagara.
