require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();

/**
 * Route to fetch user stats vocabulary
 * @method GET 
 * @route '/'
 * @request QUERY
 * @param {number} userId - User ID
 */
router.get('/', (req, res) => {
  const { userId } = req.query
  try {
    const vocabularyQuery = 'SELECT * FROM user_stats_vocabulary WHERE user_id = ?'
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

/**
 * Route to update user stats vocabulary status
 * @method POST 
 * @route '/update'
 * @request BODY
 * @param {string} status - Stat status
 * @param {string} typeStatus - Stat type status
 * @param {number} vocabularyId - Vocabulary ID
 * @param {number} userId - User ID
 */
router.post('/update/', async (req, res) => {
  const { userId, vocabularyId, typeStatus, status } = req.body

  try {
    let vocabularyQuery = 'UPDATE user_stats_vocabulary SET'
    if (typeStatus === 'kana') {
      vocabularyQuery += ' status = ?'
    } else if (typeStatus === 'kanji') {
      vocabularyQuery += ' kanji_status = ?'
    }

    ///////// First fetch the previous count to increment
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