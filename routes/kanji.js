require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();

router.get('/', (req, res) => {
  // router.get('/kanji/:params', (req, res) => {
  // FRONT : https://mydomain.dm/fruit/{"name":"My fruit name", "color":"The color of the fruit"}
  const { level, limit } = req.query;
  let sql = 'SELECT * FROM kanji';
  if (level) {
    sql += ` WHERE level = ${parseInt(level)}`;
  }
  if (limit) {
    sql += ` ORDER BY RAND() LIMIT ${parseInt(limit)}`;
  }

  mysql.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error retrieving kanji' });
    } else {
      res.status(200).send(result);
    }
  });
})

router.get('/count', (req, res) => {
  const { level } = req.query;
  let sql = 'SELECT COUNT(*) AS count FROM kanji';
  if (level) {
    sql += ` WHERE level = ${parseInt(level)}`;
  }
  mysql.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error retrieving kanji count' });
    } else {
      res.status(200).send(result[0]);
    }
  });
})

router.post('/kanji', (req, res) => {
})

router.put('/kanji/:id', (req, res) => {
})

router.delete('/kanji/:id', (req, res) => {
})

module.exports = router