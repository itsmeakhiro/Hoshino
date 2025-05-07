const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const listener = require("./system/listener").default;

// Map to store original IDs for custom IDs
const idMapping = new Map();
const allResolve = new Map();

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

  const botResponse = await new Promise(async (resolve) => {
    allResolve.set(event.messageID, resolve);
    const apiFake = new Proxy(
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
      // Pass original IDs to listener for internal use (e.g., saving provisions)
      const eventWithOriginalIDs = {
        ...event,
        senderID: getOriginalID(event.senderID),
        threadID: getOriginalID(event.threadID),
        participantIDs: event.participantIDs.map(getOriginalID),
        mentions: Object.fromEntries(
          Object.entries(event.mentions).map(([key, value]) => [getOriginalID(key), value])
        ),
        messageReply: event.messageReply
          ? { ...event.messageReply, senderID: getOriginalID(event.messageReply.senderID) }
          : undefined,
      };
      await listener({ api: apiFake, event: eventWithOriginalIDs });
    } catch (error) {
      console.error(error);
    }
  });

  res.json(botResponse);
});

// Function to generate custom ID using formatIPLegacy
function formatIPLegacy(ip) {
  try {
    const encodedIP = Buffer.from(ip)
      .toString("base64")
      .replace(/[+/=]/g, (match) => ({ "+": "0", "/": "1", "=": "" }[match]));
    return `${encodedIP}`;
  } catch (error) {
    console.error("Error in formatting IP:", error);
    return ip;
  }
}

// Function to create or retrieve custom ID and store mapping
function createCustomID(originalID) {
  if (!originalID) return originalID;
  let customID = idMapping.get(originalID);
  if (!customID) {
    customID = formatIPLegacy(originalID);
    idMapping.set(customID, originalID); // Store customID -> originalID
    idMapping.set(originalID, customID); // Store originalID -> customID for reverse lookup
  }
  return customID;
}

// Function to retrieve original ID from custom ID
function getOriginalID(customID) {
  return idMapping.get(customID) || customID; // Fallback to customID if not found
}

// Modified formatIP to use custom IDs
function formatIP(ip) {
  try {
    ip = ip?.replaceAll("custom_", "");
    return createCustomID(ip);
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
    };
    Object.assign(this, defaults, info);

    // Apply custom IDs
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

module.exports = router;

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