// Fonction pour obtenir la statistique d'un exercice sur le vobabulaire; les kanji ou les phrases 
const getExistingStat = (mysql, type, userId, exerciceId) => {
  let query = 'SELECT * FROM ';

  if (type === 'kanji') {
    query += 'user_stats_kanji WHERE user_id = ? AND kanji_id = ?';
  } else if (type === 'vocabulary') {
    query += 'user_stats_vocabulary WHERE user_id = ? AND vocabulary_id = ?';
  } else if (type === 'sentence') {
    query += 'user_stats_sentence WHERE user_id = ? AND sentence_id = ?';
  } else if (type === 'listening') {
    query += 'user_stats_listening WHERE user_id = ? AND question_id = ?';
  }

  return new Promise((resolve, reject) => {
    mysql.query(query, [userId, exerciceId], (err, results) => {
      if (err) {
        return reject('Error fetching stat: ' + err);
      }
      resolve(results[0]);
    });
  });
};

// Fonction pour insérer une nouvelle statistique d'un exercice sur le vobabulaire; les kanji ou les phrases
const insertNewStat = (mysql, type, status, userId, exerciceId, statusType = null, statusOnly = false) => {
  let query = 'INSERT INTO ';

  if (type === 'kanji') {
    query += 'user_stats_kanji (user_id, kanji_id, status, total_count, correct_count, wrong_count) VALUES (?, ?, ?, ?, ?, ?)';
  } else if (type === 'vocabulary') {
    query += 'user_stats_vocabulary (user_id, vocabulary_id, status, kanji_status, total_count, correct_count, wrong_count) VALUES (?, ?, ?, ?, ?, ?, ?)';
  } else if (type === 'sentence') {
    query += 'user_stats_sentence (user_id, sentence_id, status, total_count, correct_count, wrong_count) VALUES (?, ?, ?, ?, ?, ?)';
  } else if (type === 'listening') {
    query += 'user_stats_listening (user_id, question_id, status, total_count, correct_count, wrong_count) VALUES (?, ?, ?, ?, ?, ?)';
  }

  const insertValues = [
    userId,
    exerciceId,
    status,
    null,
    1, // total_count
    status === "correct" ? 1 : 0, // correct_count
    status === "wrong" ? 1 : 0    // wrong_count
  ];

  const insertStatusOnlyValues = [
    userId,
    exerciceId,
    statusType === 'status' ? status : 'not yet',
    type === 'kanji' && (statusType === 'kanji_status' ? status : null),
    0, // total_count
    0, // correct_count
    0 // wrong_count
  ]

  return new Promise((resolve, reject) => {
    mysql.query(query, statusOnly ? insertStatusOnlyValues : insertValues, (err, results) => {
      if (err) {
        return reject('Error inserting new stat: ' + err);
      }
      resolve(results);
    });
  });
};

// Fonction pour mettre à jour une statistique existante
const updateStat = (mysql, existingStat, status, type, statusOnly = false, statusType = null) => {
  let query = 'UPDATE ';

  if (type === 'kanji') {
    query += 'user_stats_kanji SET status = ?';
  } else if (type === 'vocabulary') {
    if (statusType === 'vocabularyStatus') {
      query += 'user_stats_vocabulary SET status = ?'
    } else if (statusType === 'kanjiStatus') {
      query += 'user_stats_vocabulary SET kanji_status = ?'
    } else {
      query += 'user_stats_vocabulary SET status = ?'
    }
  } else if (type === 'sentence') {
    query += 'user_stats_sentence SET status = ?';
  } else if (type === 'listening') {
    query += 'user_stats_listening SET status = ?';
  }

  let updateValues = [status];

  if (!statusOnly) {
    updateValues.push(existingStat.total_count + 1)
    query += ', total_count = ?'
    if (status === 'correct') {
      query += ', correct_count = ?';
      updateValues.push(existingStat.correct_count + 1);
    } else if (status === 'wrong') {
      query += ', wrong_count = ?';
      updateValues.push(existingStat.wrong_count + 1);
    }
  }

  query += ' WHERE id = ?'
  updateValues.push(existingStat.id)

  return new Promise((resolve, reject) => {
    mysql.query(query, updateValues, (err, results) => {
      if (err) {
        return reject('Error updating stat: ' + err);
      }
      resolve(results);
    });
  });
};

module.exports = { getExistingStat, insertNewStat, updateStat }