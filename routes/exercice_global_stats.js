require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();
const { getExistingStat, insertNewGlobalStat, updateStat } = require('../utils')

/**
 * Global Statistics Exercices Update
 * @method POST 
 * @route '/egs/'
 * @request BODY
 * @param {string} status - Exercice status
 * @param {string} type - Exercice type
 * @param {number} userId - User ID
 */
router.post('/', async (req, res) => {
  const { status, type, userId } = req.body;

  try {
    const existingStat = await getExistingStat(mysql, type, userId);

    if (!existingStat) {
      await insertNewGlobalStat(mysql, userId, type, status);
      res.json({ message: 'New stat inserted successfully' });
    } else {
      await updateStat(mysql, existingStat, status, type);
      res.json({ message: 'Stat updated successfully' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router