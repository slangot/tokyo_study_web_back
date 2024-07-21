require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();

router.get('/', (req, res) => {
  // router.get('/sentence/:params', (req, res) => {
  // FRONT : https://mydomain.dm/fruit/{"name":"My fruit name", "color":"The color of the fruit"}
  const { level, limit } = req.query;
  let sql = 'SELECT * FROM';
  if (level === '6') {
    sql += ' sentence_extra';
  } else {
    sql += ' sentence';
  }
  sql += ` WHERE level = ${parseInt(level)}`;
  if (limit) {
    sql += ` ORDER BY RAND() LIMIT ${parseInt(limit)}`;
  }

  mysql.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error retrieving sentence' });
    } else {
      res.status(200).send(result);
    }
  });
})

router.get('/count/:level', (req, res) => {
  const { level } = req.query;
  let sql = 'SELECT COUNT(*) AS count FROM';
  if (level === '6') {
    sql += ' sentence_extra';
  } else {
    sql += ' sentence';
  }
  sql += ` WHERE level = ${parseInt(level)}`;

  mysql.query(sql, [level], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error retrieving sentence count' });
    } else {
      res.status(200).send(result[0]);
    }
  });
})

router.get('/search', (req, res) => {
  const { word } = req.query;
  let sql = `SELECT * FROM sentence 
  WHERE kanji LIKE '%${word}%' 
  OR japanese LIKE '%${word}%' 
  OR english LIKE '%${word}%' 
  OR french LIKE '%${word}%'
  OR romaji LIKE '%${word}%'
  OR words LIKE '%${word}%'
  UNION ALL
  SELECT * FROM sentence_extra
  WHERE kanji LIKE '%${word}%' 
  OR japanese LIKE '%${word}%' 
  OR english LIKE '%${word}%' 
  OR french LIKE '%${word}%'
  OR romaji LIKE '%${word}%'
  OR words LIKE '%${word}%'
  LIMIT 50
  `
  mysql.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error retrieving sentence' });
    } else {
      res.status(200).send(result);
    }
  })
})

router.post('/sentence', (req, res) => {
})

router.put('/sentence/:id', (req, res) => {
})

router.delete('/sentence/:id', (req, res) => {
})

module.exports = router