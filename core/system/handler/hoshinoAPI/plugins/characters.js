const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const router = express.Router();

function getFilePath(senderID) {
  const directoryPath = path.join(__dirname, '../data');
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
  return path.join(directoryPath, `${senderID}data.json`);
}

function loadConversations(senderID) {
  const filePath = getFilePath(senderID);
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveConversations(senderID, data) {
  const filePath = getFilePath(senderID);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

router.get("/tate", async (req, res) => {
  const userQuery = req.query.query;
  const senderID = req.query.senderID;

  if (!userQuery || !senderID) {
    return res.json({
      response: "Missing 'query' or 'senderID' parameter.",
      developer: "Francis Loyd Raval",
    });
  }

  const conversations = loadConversations(senderID);

  try {
    conversations.push({ turn: 'user', message: userQuery });

    let context = [
      {
        message: `"Yo, what's up? I'm a 5-time world champ, living life on my own terms. You wanna know how I escaped the Matrix and found success? Let me tell ya..." What's one thing holding you back from living your best life right now? Spill the beans!`,
        turn: "bot",
        media_id: "eyJhdmF0YXJfdXJsIjogImh0dHBzOi8vdWdjLWlkbGUuczMtdXMtd2VzdC0yLmFtYXpvbmF3cy5jb20vNTdkY2U0ZmY5YTU4ZTVhN2U2MzcwNzYwNmY1MzM2ZDEuanBnIiwgInByb21wdCI6ICI1LXRpbWUga2lja2JveGluZyB3b3JsZCBjaGFtcGlvbiBBbmRyZXcgVGF0ZSwgbXVzY3VsYXIgYW5kIGNvbmZpZGVudCwgaW4gYSBoaWdoLXRlY2ggdHJhaW5pbmcgcm9vbSwgcHVuY2hpbmcgYmFnIHN3YXlpbmcgYWZ0ZXIgYSBmaWVyY2UgYmxvdywgbmVvbiBsaWdodHMgZmxhc2hpbmcuIiwgImdlbmRlciI6ICJtYW4iLCAic3R5bGUiOiBudWxsLCAiYm90X2lkIjogIjkzMjc4OSIsICJ1c2VyX2lkIjogIkhlOWsxczJxN3JWSWZSYVFPQVNONjcxZ3hRVTIiLCAiaXNfcHJlZGVmaW5lZF9wcm9tcHQiOiBmYWxzZSwgInJlc3BvbnNlX21vZGUiOiAiaW1tZWRpYXRlIiwgIm1lZGlhX2lkIjogbnVsbCwgInNhZmV0eV9tb2RlIjogImZpbHRlciIsICJ0ZXh0X2J1YmJsZSI6IG51bGwsICJlbmFibGVfaXBfYWRhcHRlciI6IGZhbHNlLCAiZm9yY2Vfc2NlbmVfaW1hZ2UiOiBmYWxzZSwgImNvaG9ydCI6IG51bGwsICJwaG90b19tb2RlbF9pZCI6ICJiYXNpYyJ9",
      },
      ...conversations.map(conv => ({
        message: conv.message,
        turn: conv.turn,
        media_id: conv.media_id || null
      }))
    ];

    let data = JSON.stringify({
      context,
      strapi_bot_id: "932789",
      output_audio: false,
      enable_proactive_photos: true,
    });

    let config = {
      method: "POST",
      url: "https://api.exh.ai/chatbot/v4/botify/response",
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Content-Type": "application/json",
        "x-auth-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxOGQ1NjRmNy02YTIwLTRkNzEtYjA3Ni00YzU1YThmNjVlNTgiLCJmaXJlYmFzZV91c2VyX2lkIjoib2hTUVZMTjBzUmI5RTdqZEhVYmFoUkVBUWJTMiIsImRldmljZV9pZCI6bnVsbCwidXNlciI6Im9oU1FWTE4wc1JiOUU3amRIVWJhaFJFQVFiUzIiLCJhY2Nlc3NfbGV2ZWwiOiJiYXNpYyIsInBsYXRmb3JtIjoid2ViIiwiZXhwIjoxNzQ0OTQ4MTAxfQ.5uFqC75hwDX23z5iEpnf2uIPSBdB7C3x7Iu6GsdMmCk",
        authorization: "Bearer eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6ImJvdGlmeS13ZWItdjMifQ.O-w89I5aX2OE_i4k6jdHZJEDWECSUfOb1lr9UdVH4oTPMkFGUNm9BNzoQjcXOu8NEiIXq64-481hnenHdUrXfg",
        "sec-ch-ua-platform": '"Linux"',
        "sec-ch-ua": '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        "sec-ch-ua-mobile": "?0",
        origin: "https://botify.ai",
        "sec-fetch-site": "cross-site",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        referer: "https://botify.ai/",
        "accept-language": "en-US,en;q=0.9",
        priority: "u=1, i",
      },
      data: data,
    };

    const response = await axios.request(config);
    const botResponse = response.data.responses?.[0]?.response || "No response found";

    conversations.push({
      turn: "bot",
      message: botResponse,
    });

    saveConversations(senderID, conversations);

    res.json({
      response: botResponse,
      developer: "Francis Loyd Raval",
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : error || "Something went wrong",
    });
  }
});

module.exports = router;