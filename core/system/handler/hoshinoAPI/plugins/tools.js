const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/verse', async (req, res) => {
  const { bible, reference } = req.query;

  if (!reference) {
    return res.status(400).json({ error: 'Reference is required' });
  }

  try {
    const encodedReference = encodeURIComponent(reference);
    const url = `https://api.biblesupersearch.com/api?bible=${bible}&reference=${encodedReference}`;
    const response = await axios.get(url);

    if (!response.data.results || response.data.results.length === 0) {
      return res.status(404).json({ error: 'No verses found' });
    }

    const verses = response.data.results[0].verses;
    res.json(verses);
  } catch (error) {
    console.error('Error fetching verses:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
