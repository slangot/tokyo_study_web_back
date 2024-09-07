require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();

router.get('/all', async (req, res) => {
  try {
    const kanjiKeysQuery = 'SELECT * FROM kanji_keys'
    mysql.query(kanjiKeysQuery, (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Error retrieving kanji keys' });
      } else {
        res.status(200).send(result);
      }
    })
  } catch (err) {
    console.error(err)
  }
})

module.exports = router