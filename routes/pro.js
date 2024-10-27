require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();

/**
 * Pro registration
 * @method POST 
 * @route '/pro/register'
 * @request BODY
 * @param {number} plan - Pro plan choice
 * @param {string} phone - Pro phone number
 */
router.post('/register', async (req, res) => {
  const { plan, phone } = req.body

  try {
    const registerQuery = 'INSERT INTO pro (plan, phone, is_boosted, students_number, start_plan, end_plan, active, reported) VALUES (?, ?, 0, 0, NOW(), NOW() + INTERVAL 1 MONTH, 0, 0)'
    const values = [plan, phone]
    mysql.query(registerQuery, values, (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Error creating pro account' });
      } else {
        res.status(200).send(result);
      }
    })
  } catch (err) {
    console.error(err)
  }
})

/**
 * Update pro user ID registration
 * @method POST 
 * @route '/pro/update-id'
 * @request BODY
 * @param {number} proId - Pro ID
 * @param {number} userId - User ID
 */
router.post('/update-id', async (req, res) => {
  const { proId, userId } = req.body

  const updateQuery = 'UPDATE pro SET user_id = ? WHERE id = ?'
  mysql.query(updateQuery, [userId, proId], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error updating pro id' });
    } else {
      res.status(200).send(result);
    }
  });
});

module.exports = router