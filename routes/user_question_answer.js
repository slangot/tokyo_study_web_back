require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();

/**
 * Fetch user question answers
 * @method GET 
 * @route '/uqa'
 */
router.get('/', (req, res) => {

  // Promise for id question_answer request
  const getQuestionAnswerId = new Promise((resolve, reject) => {
    const questionQueryAnswerId = 'SELECT * FROM question_answer ORDER BY RAND() LIMIT 1';
    mysql.query(questionQueryAnswerId, (err, results) => {
      if (err) {
        reject('Error fetching question and answer: ' + err);
      } else {
        resolve(results[0]);
      }
    });
  });

  // Execute all promises after getting questionAnwserId
  getQuestionAnswerId
    .then((questionAnswerId) => {
      if (!questionAnswerId) {
        throw new Error('Question/Answer not found');
      }

      // Promise for question_answer.question_id ID request
      const getQuestion = new Promise((resolve, reject) => {
        const questionQuery = "SELECT * FROM sentence WHERE id = ?";
        mysql.query(questionQuery, [questionAnswerId.question_id], (err, results) => {
          if (err) {
            reject('Error fetching question: ' + err);
          } else {
            resolve(results);
          }
        });
      });

      // Promise for question_answer.answer_id request
      const getAnswer = new Promise((resolve, reject) => {
        const answerQuery = "SELECT * FROM sentence WHERE id = ?";
        mysql.query(answerQuery, [questionAnswerId.answer_id], (err, results) => {
          if (err) {
            reject('Error fetching answer: ' + err);
          } else {
            resolve(results);
          }
        });
      });

      const getOthers = new Promise((resolve, reject) => {

        const allAnswersQuery = 'SELECT answer_id FROM question_answer WHERE question_id = ?';
        mysql.query(allAnswersQuery, [questionAnswerId.question_id], (err, answerIdsResults) => {
          if (err) {
            reject('Error fetching related answers: ' + err);
          } else {
            const relatedAnswerIds = answerIdsResults.map(row => row.answer_id);
            const idsToExclude = [questionAnswerId.question_id, ...relatedAnswerIds];

            // Request to fetch other sentences without those ids
            const othersQuery = `SELECT * FROM sentence WHERE id NOT IN (${idsToExclude.join(', ')}) ORDER BY RAND() LIMIT 3`;
            mysql.query(othersQuery, (err, results) => {
              if (err) {
                reject('Error fetching other sentences: ' + err);
              } else {
                resolve(results);
              }
            });
          }
        });
      });

      // Execute all the promises and send the response
      Promise.all([getQuestion, getAnswer, getOthers])
        .then(([question, answer, other_sentences]) => {
          res.status(200).json({
            questionAnswerId,
            question,
            answer,
            other_sentences
          });
        })
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
})


module.exports = router