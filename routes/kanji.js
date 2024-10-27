require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();

/**
 * Fetch a kanji with its status
 * @method GET 
 * @route '/kanji/jlpt'
 * @request QUERY
 * @param {number} level - Level
 * @param {number} userId - User ID
 */
router.get('/jlpt', async (req, res) => {
  const { level, userId } = req.query;

  const getJLPTKanji = (level) => {
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

  const getUserStatus = (userId, id) => {
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
    const allJLPTSelectedLevel = await getJLPTKanji(level);
    for (const element of allJLPTSelectedLevel) {
      const existingStat = await getUserStatus(userId, element.id);
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

/**
 * Fetch limited kanji by level and revision mode
 * @method GET 
 * @route '/kanji'
 * @request QUERY
 * @param {number} level - Level
 * @param {number} limit - Limit
 * @param {string} revision - Revison mode
 */
router.get('/', (req, res) => {
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

/**
 * Fetch and count kanji by level
 * @method GET 
 * @route '/kanji/count'
 * @request QUERY
 * @param {number} level - Level
 */
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

/**
 * Fetch detailed kanji
 * @method GET 
 * @route '/kanji/detailed'
 * @request QUERY
 * @param {string} search - Kanji search
 */
router.get('/detailed', (req, res) => {
  const { search } = req.query;
  const searchLike = `%${search}%`;

  if (!search) {
    return res.status(400).json({ error: 'Search parameter is required' });
  }

  // Promise for kanji request
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

  // Promise for vocabulary_extra request
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

  // Promise for sentence_extra request
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

  // Executes all promises and return a response when all resolved
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

/**
 * Search into kanji table
 * @method GET 
 * @route '/kanji/search'
 * @request QUERY
 * @param {string} word - Search word
 */
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

// router.post('/kanji', (req, res) => {
//   const { newKanji } = req.body;

//   // On initialise une promesse pour chaque insertion
//   const promises = newKanji.map(kanji => {
//     const query = 'INSERT INTO new_kanji ( kanji, kunyomi, onyomi, english, french, italian, german, spanish, romaji, strokes, strokes_images, video_poster, video_mp4, video_webm, radical, radical_history_images, hint, level, grade ) VALUES (?, ?, ?, ?, "", "", "", "", "", ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

//     const values = [
//       kanji.kanji,
//       kanji.kunyomi,
//       kanji.onyomi,
//       kanji.english,
//       kanji.strokes,
//       kanji.strokes_images,
//       kanji.video_poster,
//       kanji.video_mp4,
//       kanji.video_webm,
//       kanji.radical,
//       kanji.radical_history_images,
//       kanji.hint,
//       parseInt(kanji.level),
//       parseInt(kanji.grade)
//     ];

//     return new Promise((resolve, reject) => {
//       mysql.query(query, values, (err, result) => {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(result);
//         }
//       });
//     });
//   });

//   // On attend que toutes les promesses soient complétées
//   Promise.all(promises)
//     .then(results => {
//       res.status(200).send({ message: 'All kanji inserted successfully', results });
//     })
//     .catch(error => {
//       res.status(500).json({ error: 'Error inserting kanji', details: error });
//     });
// });

// router.post('/kanjiOnce', (req, res) => {
//   const { newKanji } = req.body;
//   const query = 'INSERT INTO new_kanji ( kanji, kunyomi, onyomi, english, french, italian, german, spanish, romaji, strokes, strokes_images, video_poster, video_mp4, video_webm, radical, radical_history_images, hint, level, grade ) VALUES (?, ?, ?, ?, "", "", "", "", "", ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

//   const values = [
//     newKanji.kanji,
//     newKanji.kunyomi,
//     newKanji.onyomi,
//     newKanji.english,
//     newKanji.strokes,
//     newKanji.strokes_images,
//     newKanji.video_poster,
//     newKanji.video_mp4,
//     newKanji.video_webm,
//     newKanji.radical,
//     newKanji.radical_history_images,
//     newKanji.hint,
//     parseInt(newKanji.level),
//     parseInt(newKanji.grade)
//   ];

//   mysql.query(query, values, (err, result) => {
//     if (err) {
//       res.status(500).json({ error: 'Error inserting kanji', details: error });
//     } else {
//       res.status(200).send({ message: 'Kanji inserted successfully', result });
//     }
//   });
// });

// router.post('/updateKanjiOnce', (req, res) => {
//   const { kanji, level, translation } = req.body
//   const query = "UPDATE new_kanji SET french = ?, level = ? WHERE kanji = ?"
//   mysql.query(query, [translation, level, kanji], (err, result) => {
//     if (err) {
//       res.status(500).json({ error: 'Error updating kanji' });
//     } else {
//       res.status(200).send(result);
//     }
//   })
// })

/**
 * Kanji status update
 * @method PUT 
 * @route '/jlpt/update'
 * @request QUERY
 * @param {string} status - Status
 * @param {string} jlptStatus - JLPT Status
 * @param {number} id - Kanji ID
 */
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