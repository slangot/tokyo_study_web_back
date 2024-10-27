require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();
const { getExistingStat, insertNewStat, updateStat } = require('../utils')

/**
 * Specific Statistics Exercices Update
 * @method POST 
 * @route '/es/'
 * @request BODY
 * @param {number} exerciceId - Exercice ID
 * @param {string} status - Exercice status
 * @param {string} type - Exercice type
 * @param {number} userId - User ID
 */
router.post('/update', async (req, res) => {
  const { exerciceId, status, type, userId } = req.body;

  try {
    const existingStat = await getExistingStat(mysql, type, userId, exerciceId);

    if (!existingStat) {
      await insertNewStat(mysql, type, status, userId, exerciceId);
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

/**
 * Route to only update status (if it doesn't exist, create the ligne but no counter)
 * @method POST 
 * @route '/es/update-status'
 * @request BODY
 * @param {number} elementId - Element ID
 * @param {string} status - Exercice status
 * @param {string} typeStatus - Exercice type status
 * @param {string} type - Exercice type
 * @param {number} userId - User ID
 */
router.post('/update-status', async (req, res) => {
  const { elementId, status, type, typeStatus, userId } = req.body;

  try {
    const existingStat = await getExistingStat(mysql, type, userId, elementId);
    if (!existingStat) {
      await insertNewStat(mysql, type, status, userId, elementId, typeStatus, true);
      res.json({ message: 'New stat inserted successfully' });
    } else {
      await updateStat(mysql, existingStat, status, type, true, typeStatus);
      res.json({ message: 'Stat updated successfully' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
})

module.exports = router