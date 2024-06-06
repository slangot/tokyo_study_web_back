require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();

router.get('/', (req, res) => {
  // router.get('/vocabulary/:params', (req, res) => {
  // FRONT : https://mydomain.dm/fruit/{"name":"My fruit name", "color":"The color of the fruit"}
  const { level, limit } = req.query;
  let sql = 'SELECT * FROM';
  if (level === '6') {
    sql += ' vocabulary_extra';
  } else {
    sql += ' vocabulary';
  }
  sql += ` WHERE level = ${parseInt(level)}`;
  if (limit) {
    sql += ` ORDER BY RAND() LIMIT ${parseInt(limit)}`;
  }

  mysql.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error retrieving vocabulary' });
    } else {
      res.status(200).send(result);
    }
  });
})

router.get('/count', (req, res) => {
  const { level } = req.query;
  let sql = 'SELECT COUNT(*) AS count FROM';
  if (level === '6') {
    sql += ' vocabulary_extra';
  } else {
    sql += ' vocabulary';
  }
  sql += ` WHERE level = ${parseInt(level)}`;

  mysql.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error retrieving vocabulary count' });
    } else {
      res.status(200).json(result[0]);
    }
  });
})

router.post('/', (req, res) => {
})

router.put('/:id', (req, res) => {
})

router.delete('/:id', (req, res) => {
})

module.exports = router