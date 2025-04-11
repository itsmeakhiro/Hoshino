const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get("/botify", async (req, res) => {
  let data = JSON.stringify({
    context: [
      {
        message: `"Yo, what's up? I'm a 5-time world champ, living life on my own terms. You wanna know how I escaped the Matrix and found success? Let me tell ya..." What's one thing holding you back from living your best life right now? Spill the beans!`,
        turn: "bot",
        media_id: "eyJhdmF0YXJfdXJsIjogImh0dHBzOi8vdWdjLWlkbGUuczMtdXMtd2VzdC0yLmFtYXpvbmF3cy5jb20vNTdkY2U0ZmY5YTU4ZTVhN2U2MzcwNzYwNmY1MzM2ZDEuanBnIiwgInByb21wdCI6ICI1LXRpbWUga2lja2JveGluZyB3b3JsZCBjaGFtcGlvbiBBbmRyZXcgVGF0ZSwgbXVzY3VsYXIgYW5kIGNvbmZpZGVudCwgaW4gYSBoaWdoLXRlY2ggdHJhaW5pbmcgcm9vbSwgcHVuY2hpbmcgYmFnIHN3YXlpbmcgYWZ0ZXIgYSBmaWVyY2UgYmxvdywgbmVvbiBsaWdodHMgZmxhc2hpbmcuIiwgImdlbmRlciI6ICJtYW4iLCAic3R5bGUiOiBudWxsLCAiYm90X2lkIjogIjkzMjc4OSIsICJ1c2VyX2lkIjogIkhlOWsxczJxN3JWSWZSYVFPQVNONjcxZ3hRVTIiLCAiaXNfcHJlZGVmaW5lZF9wcm9tcHQiOiBmYWxzZSwgInJlc3BvbnNlX21vZGUiOiAiaW1tZWRpYXRlIiwgIm1lZGlhX2lkIjogbnVsbCwgInNhZmV0eV9tb2RlIjogImZpbHRlciIsICJ0ZXh0X2J1YmJsZSI6IG51bGwsICJlbmFibGVfaXBfYWRhcHRlciI6IGZhbHNlLCAiZm9yY2Vfc2NlbmVfaW1hZ2UiOiBmYWxzZSwgImNvaG9ydCI6IG51bGwsICJwaG90b19tb2RlbF9pZCI6ICJiYXNpYyJ9"
      },
      {
        message: "Introduce yourself ",
        turn: "user",
        media_id: null
      }
    ],
    strapi_bot_id: "932789",
    output_audio: false,
    enable_proactive_photos: true
  });

  let config = {
    method: 'POST',
    url: 'https://api.exh.ai/chatbot/v4/botify/response',
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Content-Type': 'application/json',
      'x-auth-token': 'YOUR_X_AUTH_TOKEN_HERE',
      'authorization': 'Bearer YOUR_BEARER_TOKEN_HERE',
      'sec-ch-ua-platform': '"Linux"',
      'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
      'sec-ch-ua-mobile': '?0',
      'origin': 'https://botify.ai',
      'sec-fetch-site': 'cross-site',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'referer': 'https://botify.ai/',
      'accept-language': 'en-US,en;q=0.9',
      'priority': 'u=1, i'
    },
    data: data
  };

  try {
    const response = await axios.request(config);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

module.exports = router;
