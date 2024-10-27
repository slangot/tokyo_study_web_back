require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();

/**
 * Fetch sentence exercice by level and limit
 * @method GET 
 * @route '/sentence'
 * @request QUERY
 * @param {number} level - Level
 * @param {number} limit - Limit
 */
router.get('/', (req, res) => {
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

/**
 * Count the number of sentences by level
 * @method GET 
 * @route '/sentence/count/:level'
 * @request QUERY
 * @param {number} level - Level
 */
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

/**
 * Search into sentences
 * @method GET 
 * @route '/sentence/search'
 * @request QUERY
 * @param {string} word - Search word
 */
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

/**
 * Post a new sentence
 * @method POST 
 * @route '/sentence/new'
 * @request BODY
 * @param {object} data - A sentence object
 */
router.post('/new', (req, res) => {
  const { data } = req.body

  const sql = `INSERT INTO sentence 
  (kanji, 
  japanese,
  english,
  french,
  italian,
  german,
  spanish,
  romaji,
  theme,
  words,
  grammar,
  form,
  tense,
  direction,
  level,
  kanjiTag,
  japaneseTag,
  family,
  reported,
  comment) 
  VALUES (?, ?, "", ?, "", "", "", "", "", ?, ?, ?, ?, ?, ?, ?, ?, "", 0, "")
  `

  mysql.query(sql, [data.kanji, data.japanese, data.french, data.words, data.grammar, data.form, data.tense, data.direction, data.level, data.kanjiTag, data.japaneseTag], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error adding new sentence' });
    } else {
      res.status(200).send(result);
    }
  })
})

router.put('/sentence/:id', (req, res) => {
})

router.delete('/sentence/:id', (req, res) => {
})

module.exports = router