require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();
const { getExistingStat, insertNewStat, updateStat } = require('../utils')

// Route to update or create a statistic line
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


// Route to only update status (if it doesn't exist, create the ligne but no counter)
router.post('/update-status', async (req, res) => {
  const { status, type, type_status, element_id, user_id } = req.body;

  try {
    const existingStat = await getExistingStat(mysql, type, user_id, element_id);

    if (!existingStat) {
      await insertNewStat(mysql, type, status, user_id, element_id, type_status, true);
      res.json({ message: 'New stat inserted successfully' });
    } else {
      await updateStat(mysql, existingStat, status, type, true, type_status);
      res.json({ message: 'Stat updated successfully' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
})

module.exports = router