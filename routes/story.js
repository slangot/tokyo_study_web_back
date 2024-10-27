require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();

/**
 * Fetch a story
 * @method GET 
 * @route '/story/one'
 */
router.get('/one', (req, res) => {
  let sql = 'SELECT * FROM story ORDER BY RAND() LIMIT 1';

  mysql.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error retrieving one story' });
    } else {
      res.status(200).send(result);
    }
  });
})

module.exports = router
