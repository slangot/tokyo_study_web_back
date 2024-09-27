require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();

router.post('/', async (req, res) => {
  const { status, type, userId } = req.body;

  // Fonction pour obtenir une statistique existante
  const getExistingStat = () => {
    let query = 'SELECT * FROM user_stats_global WHERE user_id = ? AND type = ?';

    return new Promise((resolve, reject) => {
      mysql.query(query, [userId, type], (err, results) => {
        console.log('getExistingStat results : ', results)
        if (err) {
          return reject('Error fetching stat: ' + err);
        }
        resolve(results[0]);
      });
    });
  };

  // Fonction pour insérer une nouvelle statistique
  const insertNewStat = (existingStat) => {
    let query = 'INSERT INTO user_stats_global (user_id, type, total_count, correct_count, wrong_count) VALUES (?, ?, ?, ?, ?)';

    const insertValues = [
      userId,
      type,
      1, // total_count
      status === "correct" ? 1 : 0, // correct_count
      status === "wrong" ? 1 : 0    // wrong_count
    ];

    return new Promise((resolve, reject) => {
      mysql.query(query, insertValues, (err, results) => {
        console.log('insertNewStat results : ', results)
        if (err) {
          return reject('Error inserting new stat: ' + err);
        }
        resolve(results);
      });
    });
  };

  // Fonction pour mettre à jour une statistique existante
  const updateStat = (existingStat) => {
    let query = 'UPDATE user_stats_global SET total_count = ?,';
    let updateValues = [existingStat.total_count + 1];

    if (status === 'correct') {
      query += ' correct_count = ? WHERE id = ?';
      updateValues.push(existingStat.correct_count + 1, existingStat.id);
    } else if (status === 'wrong') {
      query += ' wrong_count = ? WHERE id = ?';
      updateValues.push(existingStat.wrong_count + 1, existingStat.id);
    }

    return new Promise((resolve, reject) => {
      mysql.query(query, updateValues, (err, results) => {
        console.log('updateStat results : ', results)
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

module.exports = router