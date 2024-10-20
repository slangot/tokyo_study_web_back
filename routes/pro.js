require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();

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

router.post('/update-id', async (req, res) => {
  const { pro_id, user_id } = req.body

  const updateQuery = 'UPDATE pro SET user_id = ? WHERE id = ?'
  mysql.query(updateQuery, [user_id, pro_id], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error updating pro id' });
    } else {
      res.status(200).send(result);
    }
  });
});

module.exports = router