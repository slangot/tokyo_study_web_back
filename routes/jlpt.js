require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();
const { getExercice, getExistingStat, getLimitedUserElement, getLimitedUserStatsLines, getExistingJlptManager, getRangedExercice, insertNewJlptManager, updateExistingJlptManager } = require('../utils')

/**
 * Get the user jlpt start and end study limits
 * @method GET 
 * @route '/jlpt/list-manager'
 * @request QUERY
 * @param {string} userId - User ID
 */
router.get('/list-manager', async (req, res) => {
  const { userId } = req.query
  mysql.query('SELECT * FROM user_jlpt_manager WHERE user_id = ?', [parseInt(userId)], (err, result) => {

    if (err) {
      res.status(500).json({ error: 'Error selecting user jlpt' });
    } else {
      res.status(200).send(result);
    }
  })
})

/**
 * Update or create the user jlpt limits
 * @method POST 
 * @route '/jlpt/update-list-manager'
 * @request BODY
 * @param {number} studyEnd - Study end limit
 * @param {number} studyStart - Study start limit
 * @param {string} type - Exercice type
 * @param {number} userId - User ID
 */
router.post('/update-list-manager', async (req, res) => {
  const { mode, studyEnd, studyStart, type, userId } = req.body

  try {
    const existingJlptManager = await getExistingJlptManager(mysql, type, userId)

    if (!existingJlptManager) {
      await insertNewJlptManager(mysql, type, userId)
      res.status(200).json({ message: 'New jlpt manager row inserted successfully' });
    } else {
      await updateExistingJlptManager(mode, mysql, studyStart, studyEnd, existingJlptManager.id)
      res.status(200).json({ message: 'Jlpt manager row updated successfully' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
})

/**
 * Fetch exercices elements by level; limit; mode and type
 * @method POST 
 * @route '/jlpt/list'
 * @request BODY
 * @param {number} level - Level
 * @param {number} limit - Limit
 * @param {string} mode - Exercice mode
 * @param {string} type - Exercice type
 * @param {number} userId - User ID
 */
router.post('/list', async (req, res) => {
  const { level, limit, mode, type, userId } = req.body;

  try {
    if (mode === 'all') {
      const fetchedLimitedExercice = await getExercice(mysql, level, limit, type)

      if (fetchedLimitedExercice) {
        res.status(200).send(fetchedLimitedExercice)
      } else {
        res.status(404).json({ error: 'Not found' })
      }
    } else if (mode === 'correct' || mode === 'false') {
      const existingLines = await getLimitedUserStatsLines(mysql, limit, mode, type, userId)

      const selectedLines = []
      if (existingLines) {
        for (const line of existingLines) {
          const fetchedLine = await getLimitedUserElement(mysql, line.id, level, type)
          if (fetchedLine) {
            fetchedLine.status = line.status
            fetchedLine.kanji_status = line?.kanji_status
            fetchedLine.statId = line.id
            selectedLines.push(fetchedLine)
          }
        }
        res.status(200).send(selectedLines);
      }
    } else if (mode === 'studying') {

      // Fetch user defined limits
      const existingJlptLimit = await getExistingJlptManager(mysql, type, userId)

      if (existingJlptLimit) {
        // Fetch limited elements between user limits by type
        const existingRangedExercices = await getRangedExercice(mysql, limit, existingJlptLimit.study_end, existingJlptLimit.study_start, type)
        const selectedExercices = []
        if (existingRangedExercices) {

          // For each elements we fetch if status exist and we add it
          for (const exercice of existingRangedExercices) {

            const fetchedExercice = await getExistingStat(mysql, type, userId, exercice.id)
            if (fetchedExercice) {
              exercice.status = fetchedExercice.status
              exercice.kanji_status = fetchedExercice?.kanji_status
              exercice.statId = fetchedExercice.id
            } else {
              exercice.status = null
              exercice.kanji_status = null
              exercice.statId = null
            }
            selectedExercices.push(exercice)
          }
          res.status(200).send(selectedExercices)
        } else {
          res.status(404).json({ error: 'Ranged exercices not found' })
        }
      } else {
        const insertJlptLimit = await insertNewJlptManager(mysql, type, userId)
        if (!insertJlptLimit) {
          res.status(404).json({ error: 'Error inserting new limits' })
        }
        const rangedExercices = await getRangedExercice(mysql, limit, 10, 0, type)
        if (rangedExercices) {
          res.status(200).send(rangedExercices)
        } else {
          res.status(404).json({ error: 'Error fetching ranged exercices' })
        }
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
})

/**
 * Update or create an user statistic line
 * @method POST 
 * @route '/jlpt/stats'
 * @request BODY
 * @param {number} userId - User ID
 */
router.post('/stats', async (req, res) => {
  const { userId } = req.body;

  const getIdsStatsByLevel = (type, level) => {
    let query = `SELECT id FROM ${type} WHERE level = ?`
    return new Promise((resolve, reject) => {
      mysql.query(query, [level], (err, results) => {
        if (err) {
          return reject('Error selected table id stats: ' + err);
        }
        resolve(results)
      })
    })
  }

  const getUserAllStatsByType = (type, userId) => {
    const tableType = type === 'vocabulary' ? 'user_stats_vocabulary' : 'user_stats_kanji'
    let query = `SELECT * FROM ${tableType} WHERE user_id = ?`
    return new Promise((resolve, reject) => {
      mysql.query(query, [userId], (err, results) => {
        if (err) {
          return reject('Error selected user stats: ' + err);
        }
        resolve(results)
      })
    })
  }

  const manageStats = (type, levelStats, userLevelStats) => {

    if (levelStats) {

      // Convert the objects into one array
      const statsIds = Object.keys(levelStats).map((id) => id);

      let studied = 0;
      let correct = 0;
      let wrong = 0;

      userLevelStats.forEach(userItem => {
        if (type === 'vocabulary') {
          if (statsIds.includes((userItem.vocabulary_id).toString())) {
            studied++;
            if (userItem.status === 'correct') {
              correct++;
            } else {
              wrong++;
            }
          }
        } else if (type === 'kanji') {
          if (statsIds.includes((userItem.kanji_id).toString())) {
            studied++;
            if (userItem.status === 'correct') {
              correct++;
            } else {
              wrong++;
            }
          }
        }
      });

      const result = {
        studied: studied,
        correct: correct,
        wrong: wrong
      }
      return result;
    }
  }

  try {
    // List of stats IDS
    const levelN5IdsVocabularyStats = await getIdsStatsByLevel('vocabulary', 5)
    const levelN5IdsKanjiStats = await getIdsStatsByLevel('kanji', 5)
    const levelN4IdsVocabularyStats = await getIdsStatsByLevel('vocabulary', 4)
    const levelN4IdsKanjiStats = await getIdsStatsByLevel('kanji', 4)
    const levelN3IdsVocabularyStats = await getIdsStatsByLevel('vocabulary', 3)
    const levelN3IdsKanjiStats = await getIdsStatsByLevel('kanji', 3)

    // List of the user
    const allUserVocabularyStats = await getUserAllStatsByType('vocabulary', userId)
    const allUserKanjiStats = await getUserAllStatsByType('kanji', userId)

    // Counts of the user stats
    // Vocabulary
    const vocabularyN5UsersCounters = manageStats('vocabulary', levelN5IdsVocabularyStats, allUserVocabularyStats)
    const vocabularyN4UsersCounters = manageStats('vocabulary', levelN4IdsVocabularyStats, allUserVocabularyStats)
    const vocabularyN3UsersCounters = manageStats('vocabulary', levelN3IdsVocabularyStats, allUserVocabularyStats)

    // Kanji
    const kanjiN5UsersCounters = manageStats('kanji', levelN5IdsKanjiStats, allUserKanjiStats)
    const kanjiN4UsersCounters = manageStats('kanji', levelN4IdsKanjiStats, allUserKanjiStats)
    const kanjiN3UsersCounters = manageStats('kanji', levelN3IdsKanjiStats, allUserKanjiStats)

    const userStatsCounters = {
      allN5Voc: levelN5IdsVocabularyStats.length,
      allN4Voc: levelN4IdsVocabularyStats.length,
      allN3Voc: levelN3IdsVocabularyStats.length,
      allN5Kanji: levelN5IdsKanjiStats.length,
      allN4Kanji: levelN4IdsKanjiStats.length,
      allN3Kanji: levelN3IdsKanjiStats.length,
      userN5VocStudied: vocabularyN5UsersCounters.studied,
      userN5VocCorrect: vocabularyN5UsersCounters.correct,
      userN5VocWrong: vocabularyN5UsersCounters.wrong,
      userN4VocStudied: vocabularyN4UsersCounters.studied,
      userN4VocCorrect: vocabularyN4UsersCounters.correct,
      userN4VocWrong: vocabularyN4UsersCounters.wrong,
      userN3VocStudied: vocabularyN3UsersCounters.studied,
      userN3VocCorrect: vocabularyN3UsersCounters.correct,
      userN3VocWrong: vocabularyN3UsersCounters.wrong,
      userN5KanjiStudied: kanjiN5UsersCounters.studied,
      userN5KanjiCorrect: kanjiN5UsersCounters.correct,
      userN5KanjiWrong: kanjiN5UsersCounters.wrong,
      userN4KanjiStudied: kanjiN4UsersCounters.studied,
      userN4KanjiCorrect: kanjiN4UsersCounters.correct,
      userN4KanjiWrong: kanjiN4UsersCounters.wrong,
      userN3KanjiStudied: kanjiN3UsersCounters.studied,
      userN3KanjiCorrect: kanjiN3UsersCounters.correct,
      userN3KanjiWrong: kanjiN3UsersCounters.wrong,
    }
    res.status(200).send(userStatsCounters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
})

module.exports = router