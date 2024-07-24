require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();

router.get('/', (req, res) => {
  // router.get('/vocabulary/:params', (req, res) => {
  // FRONT : https://mydomain.dm/fruit/{"name":"My fruit name", "color":"The color of the fruit"}
  const { level, limit, revision } = req.query;
  let sql = 'SELECT * FROM';

  if (level === '6') {
    sql += ' vocabulary_extra';
  } else {
    sql += ' vocabulary';
  }

  sql += ` WHERE level = ${parseInt(level)}`;

  if (revision) {
    if (revision === 'new') {
      sql += ' AND (status IS NULL OR status = "")';
    } else if (revision === 'study') {
      sql += ' AND is_studied = 1'
    } else {
      sql += ` AND status = "${revision}"`;
    }
  }

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

router.get('/search', (req, res) => {
  const { word } = req.query;
  let sql = `SELECT * FROM vocabulary 
  WHERE kanji LIKE '%${word}%' 
  OR japanese LIKE '%${word}%' 
  OR english LIKE '%${word}%' 
  OR french LIKE '%${word}%'
  OR romaji LIKE '%${word}%'
  UNION ALL
  SELECT * FROM vocabulary_extra
  WHERE kanji LIKE '%${word}%' 
  OR japanese LIKE '%${word}%' 
  OR english LIKE '%${word}%' 
  OR french LIKE '%${word}%'
  OR romaji LIKE '%${word}%'
  LIMIT 50
  `
  mysql.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error retrieving vocabulary' });
    } else {
      res.status(200).send(result);
    }
  })
})

router.post('/', (req, res) => {
})

router.put('/update', (req, res) => {
  const { id, status, jlptStatus, kanjiStatus } = req.query;

  let updateQuery = 'UPDATE vocabulary SET'
  if (jlptStatus) {
    updateQuery += ' jlpt_status'
  } else if (kanjiStatus) {
    updateQuery += ' kanji_status'
  } else {
    updateQuery += ' status'
  }
  updateQuery += ' = ?, last_reading = NOW() WHERE id = ?';

  mysql.query(updateQuery, [status, id], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error updating vocabulary' });
    } else {
      res.status(200).send(result);
    }
  });
})

router.delete('/:id', (req, res) => {
})

module.exports = router