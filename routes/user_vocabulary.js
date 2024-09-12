require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();

router.get('/', (req, res) => {
  const { userId } = req.query
  try {
    const vocabularyQuery = 'SELECT * FROM user_vocabulary WHERE user_id = ?'
    mysql.query(vocabularyQuery, [userId], (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Error retrieving vocabulary' });
      } else {
        res.status(200).send(result);
      }
    })
  } catch (err) {
    console.error(err)
  }
})

router.post('/update/', async (req, res) => {
  const { userId, vocabularyId, statusType, status } = req.body

  try {
    let vocabularyQuery = 'UPDATE user_vocabulary SET'
    if (statusType === 'kana') {
      vocabularyQuery += ' status = ?'
    } else if (statusType === 'kanji') {
      vocabularyQuery += ' kanji_status = ?'
    }

    ///////// FETCH D'ABORD LES PRECEDENTS COUNT POUR INCREMENTER 
    if (status === 'correct') {
      vocabularyQuery += ', correct_count = correct_count + 1'
    } else if (status === 'wrong') {
      vocabularyQuery += ', wrong_count = wrong_count + 1'
    }

    vocabularyQuery += ', total_count = total_count + 1 WHERE userId = ? AND vocabularyId = ?'

    mysql.query(vocabularyQuery, [status, userId, vocabularyId], (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Error updating user vocabulary info' });
      } else {
        res.status(200).send(result);
      }
    })
  } catch (err) {
    console.error(err)
  }
})

module.exports = router