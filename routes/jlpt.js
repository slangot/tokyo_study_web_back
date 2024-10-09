require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();
const { getLimitedUserElement, getLimitedUserStatsLines } = require('../utils')

// Route to update or create a statistic line
router.post('/list', async (req, res) => {
  const { level, limit, mode, type, userId } = req.body;

  try {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
})

// Route to update or create a statistic line
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