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

router.get('/detailed', (req, res) => {
  const { search } = req.query;
  const searchLike = `%${search}%`;
  console.log('search:', search);

  if (!search) {
    return res.status(400).json({ error: 'Search parameter is required' });
  }

  // Promesse pour la requête kanji
  const getKanji = new Promise((resolve, reject) => {
    const kanjiQuery = 'SELECT * FROM kanji WHERE kanji = ?';
    mysql.query(kanjiQuery, [search], (err, results) => {
      if (err) {
        reject('Error fetching kanji: ' + err);
      } else {
        resolve(results[0]);
      }
    });
  });

  // Promesse pour la requête vocabulary_extra
  const getVocabulary = new Promise((resolve, reject) => {
    const vocabularyQuery = "SELECT * FROM vocabulary_extra WHERE kanji LIKE ? LIMIT 10";
    mysql.query(vocabularyQuery, [searchLike], (err, results) => {
      if (err) {
        reject('Error fetching vocabulary: ' + err);
      } else {
        resolve(results);
      }
    });
  });

  // Promesse pour la requête sentence_extra
  const getSentences = new Promise((resolve, reject) => {
    const sentenceQuery = 'SELECT * FROM sentence_extra WHERE kanji LIKE ? LIMIT 5';
    mysql.query(sentenceQuery, [searchLike], (err, results) => {
      if (err) {
        reject('Error fetching sentences: ' + err);
      } else {
        resolve(results);
      }
    });
  });

  // Exécuter toutes les promesses et envoyer la réponse une fois toutes résolues
  Promise.all([getKanji, getVocabulary, getSentences])
    .then(([kanji, vocabulary, sentences]) => {
      if (!kanji) {
        return res.status(404).json({ error: 'Kanji not found' });
      }
      res.status(200).json({
        kanji,
        vocabulary,
        sentences
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

router.post('/kanji', (req, res) => {
})

router.put('/kanji/:id', (req, res) => {
})

router.delete('/kanji/:id', (req, res) => {
})

module.exports = router