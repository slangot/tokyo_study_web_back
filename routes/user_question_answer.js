require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();

router.get('/', (req, res) => {

  // Promesse pour la requête de l'id question_answer
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

  // Exécuter toutes les promesses après avoir obtenu questionAnswerId
  getQuestionAnswerId
    .then((questionAnswerId) => {
      if (!questionAnswerId) {
        throw new Error('Question/Answer not found');
      }

      // Promesse pour la requête l'id question_answer.question_id
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

      // Promesse pour la requête question_answer.answer_id
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
        // D'abord, récupérer tous les `answer_id` associés au même `question_id`
        const allAnswersQuery = 'SELECT answer_id FROM question_answer WHERE question_id = ?';
        mysql.query(allAnswersQuery, [questionAnswerId.question_id], (err, answerIdsResults) => {
          if (err) {
            reject('Error fetching related answers: ' + err);
          } else {
            // Extraire tous les `answer_id` liés
            const relatedAnswerIds = answerIdsResults.map(row => row.answer_id);

            // Inclure également le `question_id` lui-même à exclure
            const idsToExclude = [questionAnswerId.question_id, ...relatedAnswerIds];

            // Requête pour récupérer les autres phrases en excluant ces `id`
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

      // Exécuter toutes les promesses et envoyer la réponse une fois toutes résolues
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