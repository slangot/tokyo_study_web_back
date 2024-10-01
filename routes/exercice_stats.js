require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();

router.post('/update', async (req, res) => {
  const { exerciceId, status, type, userId } = req.body;

  // Fonction pour obtenir une statistique existante
  const getExistingStat = () => {
    let query = 'SELECT * FROM ';

    if (type === 'kanji') {
      query += 'user_stats_kanji WHERE user_id = ? AND kanji_id = ?';
    } else if (type === 'vocabulary') {
      query += 'user_stats_vocabulary WHERE user_id = ? AND vocabulary_id = ?';
    } else if (type === 'sentence') {
      query += 'user_stats_sentence WHERE user_id = ? AND sentence_id = ?';
    } else if (type === 'listening') {
      query += 'user_stats_listening WHERE user_id = ? AND question_id = ?';
    }

    return new Promise((resolve, reject) => {
      mysql.query(query, [userId, exerciceId], (err, results) => {
        if (err) {
          return reject('Error fetching stat: ' + err);
        }
        resolve(results[0]);
      });
    });
  };

  // Fonction pour insérer une nouvelle statistique
  const insertNewStat = () => {
    let query = 'INSERT INTO ';

    if (type === 'kanji') {
      query += 'user_stats_kanji (user_id, kanji_id, status, total_count, correct_count, wrong_count) VALUES (?, ?, ?, ?, ?, ?)';
    } else if (type === 'vocabulary') {
      query += 'user_stats_vocabulary (user_id, vocabulary_id, status, total_count, correct_count, wrong_count) VALUES (?, ?, ?, ?, ?, ?)';
    } else if (type === 'sentence') {
      query += 'user_stats_sentence (user_id, sentence_id, status, total_count, correct_count, wrong_count) VALUES (?, ?, ?, ?, ?, ?)';
    } else if (type === 'listening') {
      query += 'user_stats_listening (user_id, question_id, status, total_count, correct_count, wrong_count) VALUES (?, ?, ?, ?, ?, ?)';
    }

    const insertValues = [
      userId,
      exerciceId,
      status,
      1, // total_count
      status === "correct" ? 1 : 0, // correct_count
      status === "wrong" ? 1 : 0    // wrong_count
    ];

    return new Promise((resolve, reject) => {
      mysql.query(query, insertValues, (err, results) => {
        if (err) {
          return reject('Error inserting new stat: ' + err);
        }
        resolve(results);
      });
    });
  };

  // Fonction pour mettre à jour une statistique existante
  const updateStat = (existingStat) => {
    let query = 'UPDATE ';
    let updateValues = [status, existingStat.total_count + 1];

    if (type === 'kanji') {
      query += 'user_stats_kanji SET status = ?, total_count = ?,';
    } else if (type === 'vocabulary') {
      query += 'user_stats_vocabulary SET status = ?, total_count = ?,'
    } else if (type === 'sentence') {
      query += 'user_stats_sentence SET status = ?, total_count = ?,';
    } else if (type === 'listening') {
      query += 'user_stats_listening SET status = ?, total_count = ?,';
    }

    if (status === 'correct') {
      query += ' correct_count = ? WHERE id = ?';
      updateValues.push(existingStat.correct_count + 1, existingStat.id);
    } else if (status === 'wrong') {
      query += ' wrong_count = ? WHERE id = ?';
      updateValues.push(existingStat.wrong_count + 1, existingStat.id);
    }

    return new Promise((resolve, reject) => {
      mysql.query(query, updateValues, (err, results) => {
        if (err) {
          return reject('Error updating stat: ' + err);
        }
        resolve(results);
      });
    });
  };

  try {
    const existingStat = await getExistingStat();

    if (!existingStat) {
      await insertNewStat();
      res.json({ message: 'New stat inserted successfully' });
    } else {
      await updateStat(existingStat);
      res.json({ message: 'Stat updated successfully' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/update-status', (req, res) => {
  const { status, type, type_status, element_id, user_id } = req.body;

  let updateQuery = 'UPDATE'

  if (type === 'vocabulary') {
    updateQuery += ' user_stats_vocabulary SET'
  } else if (type === 'kanji') {
    updateQuery += ' user_stats_kanji SET'
  }

  if (type_status === 'vocabularyStatus') {
    updateQuery += ' status = ?'
  } else if (type_status === 'kanjiStatus') {
    updateQuery += ' kanji_status = ?'
  }

  if (type === 'vocabulary') {
    updateQuery += ' WHERE user_id = ? AND vocabulary_id = ?';
  } else if (type === 'kanji') {
    updateQuery += ' WHERE user_id = ? AND kanji_id = ?';
  }

  mysql.query(updateQuery, [status, user_id, element_id], (err, result) => {
    if (err) {
      res.status(500).json({ error: `Error updating ${type} ${type_status}` });
    } else {
      res.status(200).send(result);
    }
  });
})

module.exports = router