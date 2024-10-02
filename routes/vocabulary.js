require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();

router.get('/jlpt', async (req, res) => {
  const { level, limit, revision, userId } = req.query;

  const getJLPTVocabulary = () => {
    let query = 'SELECT * FROM vocabulary WHERE level = ?';

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
    let query = 'SELECT * FROM user_stats_vocabulary WHERE user_id = ? AND vocabulary_id = ?'

    return new Promise((resolve, reject) => {
      mysql.query(query, [userId, id], (err, results) => {
        if (err) {
          return reject('Error fetching user selected vocabulary stat: ' + err);
        }
        resolve(results[0]);
      });
    });
  };

  try {
    const allJLPTSelectedLevel = await getJLPTVocabulary();
    for (const element of allJLPTSelectedLevel) {
      const existingStat = await getUserStatus(element.id);
      if (existingStat) {
        element.status = existingStat.status;
        element.kanji_status = existingStat.kanji_status;
      } else {
        element.status = 'not done';
        element.kanji_status = null;
      }
    }
    res.status(200).send(allJLPTSelectedLevel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
})

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
    } else if (revision === 'jlpt') {
      sql += ' AND jlpt_status = "done"'
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

router.post('/list', async (req, res) => {
  // router.get('/vocabulary/:params', (req, res) => {
  // FRONT : https://mydomain.dm/fruit/{"name":"My fruit name", "color":"The color of the fruit"}
  const { level, limit, mode, type, userId } = req.body;

  const getLimitedUserStatsLines = (limit, mode, type, userId) => {
    let query = 'SELECT * FROM'
    const values = []

    if (type === 'kanji') {
      query += ' user_stats_kanji'
    } else if (type === 'vocabulary') {
      query += ' user_stats_vocabulary'
    }

    if (mode === 'all') {
      query += ' WHERE user_id = ?'
      values.push(userId)
    } else {
      query += ' WHERE user_id = ? AND status = ?'
      values.push(userId)
      values.push(mode)
    }

    if (limit) {
      query += ' ORDER BY RAND() LIMIT ?'
      values.push(limit)
    }

    return new Promise((resolve, reject) => {
      mysql.query(query, values, (err, results) => {
        if (err) {
          return reject('Error fetching limited user stats lines : ' + err);
        }
        resolve(results);
      });
    });
  };

  const getLimitedUserElement = (id, level, type) => {
    let query = 'SELECT * FROM'
    if (type === 'vocabulary') {
      query += ' vocabulary'
    } else if (type === 'kanji') {
      query += ' kanji'
    }

    query += ' WHERE id = ? AND level = ?'

    return new Promise((resolve, reject) => {
      mysql.query(query, [id, level], (err, results) => {
        if (err) {
          return reject('Error fetching user selected element : ' + err);
        }
        resolve(results[0]);
      });
    });
  }

  try {
    const existingLines = await getLimitedUserStatsLines(limit, mode, type, userId)
    const selectedLines = []
    if (existingLines) {
      for (const line of existingLines) {
        const fetchedLine = await getLimitedUserElement(line.id, level, type)
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

router.get('/verb', (req, res) => {
  const sql = `SELECT * FROM verb ORDER BY RAND() LIMIT 1`
  mysql.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error retrieving verb' });
    } else {
      res.status(200).send(result);
    }
  })
})

router.get('/adjective', (req, res) => {
  const sql = `SELECT * FROM vocabulary WHERE categories = "adjective" ORDER BY RAND() LIMIT 1`
  mysql.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error retrieving verb' });
    } else {
      res.status(200).send(result);
    }
  })
})

router.post('/', (req, res) => {
})

router.delete('/:id', (req, res) => {
})

module.exports = router