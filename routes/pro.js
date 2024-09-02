require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();

router.post('/register', async (req, res) => {
  const { plan, phone } = req.body
  try {
    const registerQuery = 'INSERT INTO pro (plan, phone, start_plan, end_plan, active, reported) VALUES (?, ?, NOW(), NOW() + INTERVAL 1 MONTH, 0, 0)'
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

module.exports = router