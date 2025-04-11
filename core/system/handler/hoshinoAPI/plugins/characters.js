const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

router.get('/tate', async (req, res) => {
  const { senderID, query } = req.query;
  if (!senderID || !query) return res.status(400).json({ error: 'Missing senderID or query' });

  const convoPath = path.join(__dirname, `../plugins/${senderID}convo.json`);
  let context = [];

  if (fs.existsSync(convoPath)) {
    context = JSON.parse(fs.readFileSync(convoPath, 'utf8'));
  }

  context.push({ message: query, turn: 'user', media_id: null });

  let data = JSON.stringify({
    context: context,
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
      'x-auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMGRkYzY3NS01NmU3LTQ3ZGItYmJkOS01YWVjM2Q3OWI2YjMiLCJmaXJlYmFzZV91c2VyX2lkIjoiSGU5azFzMnE3clZJZlJhUU9BU042NzFneFFVMiIsImRldmljZV9pZCI6bnVsbCwidXNlciI6IkhlOWsxczJxN3JWSWZSYVFPQVNONjcxZ3hRVTIiLCJhY2Nlc3NfbGV2ZWwiOiJiYXNpYyIsInBsYXRmb3JtIjoid2ViIiwiZXhwIjoxNzQ0ODk0MzQ4fQ.0iqzd2dzxqZq-ooUwZad9Vwg-GnLLkCy4vxs-b-r5ro',
      'authorization': 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6ImJvdGlmeS13ZWItdjMifQ.O-w89I5aX2OE_i4k6jdHZJEDWECSUfOb1lr9UdVH4oTPMkFGUNm9BNzoQjcXOu8NEiIXq64-481hnenHdUrXfg',
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
    const botMessage = response.data?.response?.message || "No response";
    context.push({ message: botMessage, turn: 'bot', media_id: null });
    fs.writeFileSync(convoPath, JSON.stringify(context, null, 2));
    res.json({ reply: botMessage });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get bot response' });
  }
});

module.exports = router;