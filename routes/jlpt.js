require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();
const { getLimitedUserElement, getLimitedUserStatsLines } = require('../utils')

// Route to update or create a statistic line
router.post('/list', async (req, res) => {
  const { level, limit, mode, type, userId } = req.body;

  try {
    const existingLines = await getLimitedUserStatsLines(mysql, limit, mode, type, userId)
    const selectedLines = []
    if (existingLines) {
      for (const line of existingLines) {
        const fetchedLine = await getLimitedUserElement(mysql, line.id, level, type)
        if (fetchedLine) {
          fetchedLine.status = line.status
          fetchedLine.kanji_status = line?.kanji_status
          fetchedLine.statId = line.id
          selectedLines.push(fetchedLine)
        }
      }
      res.status(200).send(selectedLines);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
})

module.exports = router