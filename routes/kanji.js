require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();

router.get('/jlpt', async (req, res) => {
  const { level, limit, revision, userId } = req.query;

  const getJLPTKanji = () => {
    let query = 'SELECT * FROM kanji WHERE level = ?';

    return new Promise((resolve, reject) => {
      mysql.query(query, [level], (err, results) => {
        if (err) {
          return reject('Error fetching all selected JLPT level: ' + err);
        }
        resolve(results);
      });
    });
  };

  const getUserStatus = (id) => {
    let query = 'SELECT * FROM user_stats_kanji WHERE user_id = ? AND kanji_id = ?'

    return new Promise((resolve, reject) => {
      mysql.query(query, [userId, id], (err, results) => {
        if (err) {
          return reject('Error fetching user selected kanji stat: ' + err);
        }
        resolve(results[0]);
      });
    });
  };

  try {
    const allJLPTSelectedLevel = await getJLPTKanji();
    for (const element of allJLPTSelectedLevel) {
      const existingStat = await getUserStatus(element.id);
      if (existingStat) {
        element.status = existingStat.status;
      } else {
        element.status = 'not done';
      }
    }
    res.status(200).send(allJLPTSelectedLevel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
})

router.get('/', (req, res) => {
  // router.get('/kanji/:params', (req, res) => {
  // FRONT : https://mydomain.dm/fruit/{"name":"My fruit name", "color":"The color of the fruit"}
  const { level, revision, limit } = req.query;
  let sql = 'SELECT * FROM kanji';

  const conditions = [];
  const values = [];

  if (level) {
    conditions.push('level = ?');
    values.push(parseInt(level));
  }

  if (revision) {
    if (revision === 'new') {
      conditions.push('(status IS NULL OR status = "")');
    } else if (revision === 'study') {
      conditions.push('is_studied = 1')
    } else if (revision === 'jlpt') {
      conditions.push('jlpt_status = "done"')
    } else {
      conditions.push('status = ?');
      values.push(revision);
    }
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  if (limit) {
    sql += ` ORDER BY RAND() LIMIT ?`;
    values.push(parseInt(limit));
  }


  mysql.query(sql, values, (err, result) => {
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

router.get('/search', (req, res) => {
  const { word } = req.query;
  let sql = `SELECT * FROM kanji 
  WHERE kanji LIKE '%${word}%' 
  OR kunyomi LIKE '%${word}%' 
  OR onyomi LIKE '%${word}%' 
  OR english LIKE '%${word}%' 
  OR french LIKE '%${word}%'
  LIMIT 50
  `
  mysql.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error retrieving kanji' });
    } else {
      res.status(200).send(result);
    }
  })
})


router.put('/update', (req, res) => {
  const { id, status, jlptStatus } = req.query;
  let updateQuery = 'UPDATE kanji SET'
  if (jlptStatus == '1') {
    updateQuery += ' jlpt_status'
  } else {
    updateQuery += ' status'
  }
  updateQuery += ' = ?, last_reading = NOW() WHERE id = ?';
  mysql.query(updateQuery, [status, id], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error updating kanji' });
    } else {
      res.status(200).send(result);
    }
  });
})

router.delete('/kanji/:id', (req, res) => {
})

module.exports = router