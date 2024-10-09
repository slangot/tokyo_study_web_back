// Function to get unique statistic of vocabulary, kanji or sentence exercice 
const getExistingStat = (mysql, type, userId, exerciceId) => {
  let query = 'SELECT * FROM ';
  const values = [userId]

  if (type === 'kanji') {
    query += 'user_stats_kanji WHERE user_id = ? AND kanji_id = ?';
    values.push(exerciceId)
  } else if (type === 'vocabulary') {
    query += 'user_stats_vocabulary WHERE user_id = ? AND vocabulary_id = ?';
    values.push(exerciceId)
  } else if (type === 'sentence') {
    query += 'user_stats_sentence WHERE user_id = ? AND sentence_id = ?';
    values.push(exerciceId)
  } else if (type === 'listening') {
    query += 'user_stats_listening WHERE user_id = ? AND question_id = ?';
    values.push(exerciceId)
  }
  // Else for global exercice (date, time, number, verb, adjective)
  else {
    query += 'user_stats_global WHERE user_id = ? AND type = ?';
    values.push(type)
  }

  return new Promise((resolve, reject) => {
    mysql.query(query, values, (err, results) => {
      if (err) {
        return reject('Error fetching stat: ' + err);
      }
      resolve(results[0]);
    });
  });
};

// Function to insert new vocabulary, kanji or sentence exercice statistic
const insertNewStat = (mysql, type, status, userId, exerciceId, statusType = null, statusOnly = false) => {
  let query = 'INSERT INTO ';

  const insertValues = [
    userId,
    exerciceId,
    status,
  ];

  const insertStatusOnlyValues = [
    userId,
    exerciceId,
    statusType === 'status' ? status : 'not yet',
  ]

  if (type === 'kanji') {
    query += 'user_stats_kanji (user_id, kanji_id, status, total_count, correct_count, wrong_count) VALUES (?, ?, ?, ?, ?, ?)';
    statusType === 'kanji_status' && insertStatusOnlyValues.push(status)
  } else if (type === 'vocabulary') {
    insertValues.push(null)
    query += 'user_stats_vocabulary (user_id, vocabulary_id, status, kanji_status, total_count, correct_count, wrong_count) VALUES (?, ?, ?, ?, ?, ?, ?)';
  } else if (type === 'sentence') {
    query += 'user_stats_sentence (user_id, sentence_id, status, total_count, correct_count, wrong_count) VALUES (?, ?, ?, ?, ?, ?)';
  } else if (type === 'listening') {
    query += 'user_stats_listening (user_id, question_id, status, total_count, correct_count, wrong_count) VALUES (?, ?, ?, ?, ?, ?)';
  }

  insertValues.push(1, status === "correct" ? 1 : 0, status === "wrong" ? 1 : 0)
  insertStatusOnlyValues.push(0, 0, 0)

  return new Promise((resolve, reject) => {
    mysql.query(query, statusOnly ? insertStatusOnlyValues : insertValues, (err, results) => {
      if (err) {
        return reject('Error inserting new stat: ' + err);
      }
      resolve(results);
    });
  });
};

// Function to insert new global exercice statistic (date, time, number)
const insertNewGlobalStat = (mysql, userId, type, status) => {
  let query = 'INSERT INTO user_stats_global (user_id, type, total_count, correct_count, wrong_count) VALUES (?, ?, ?, ?, ?)';

  const insertValues = [
    userId,
    type,
    1, // total_count
    status === "correct" ? 1 : 0, // correct_count
    status === "wrong" ? 1 : 0    // wrong_count
  ];

  return new Promise((resolve, reject) => {
    mysql.query(query, insertValues, (err, results) => {
      if (err) {
        return reject('Error inserting new stat: ' + err);
      }
      resolve(results);
    });
  });
};

// Function to update a statistic
const updateStat = (mysql, existingStat, status, type, statusOnly = false, statusType = null) => {
  let query = 'UPDATE ';
  const updateValues = [];

  // table selection
  if (type === 'kanji') {
    query += 'user_stats_kanji SET status = ?';
    updateValues.push(status)
  } else if (type === 'vocabulary') {
    if (statusType === 'vocabularyStatus') {
      query += 'user_stats_vocabulary SET status = ?'
    } else if (statusType === 'kanjiStatus') {
      query += 'user_stats_vocabulary SET kanji_status = ?'
    } else {
      query += 'user_stats_vocabulary SET status = ?'
    }
    updateValues.push(status)
  } else if (type === 'sentence') {
    query += 'user_stats_sentence SET status = ?';
    updateValues.push(status)
  } else if (type === 'listening') {
    query += 'user_stats_listening SET status = ?';
    updateValues.push(status)
  }
  // Else for global exercice (date, time, number, verb, adjective)
  else {
    query += 'user_stats_global SET type = ?'
    updateValues.push(type)
  }

  // status update only
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
  query.replace('rmv_BG,', '')
  return new Promise((resolve, reject) => {
    mysql.query(query, updateValues, (err, results) => {
      if (err) {
        return reject('Error updating stat: ' + err);
      }
      resolve(results);
    });
  });
};

// Function to fetch limited user stats lines (for the JLPT List exercice)
const getLimitedUserStatsLines = (mysql, limit, mode, type, userId) => {
  let query = 'SELECT * FROM'
  const values = []

  if (type === 'kanji') {
    query += ' user_stats_kanji'
  } else if (type === 'vocabulary') {
    query += ' user_stats_vocabulary'
  }

  if (mode === 'all') {
    query += ' WHERE user_id = ?'
    values.push(userId)
  } else {
    query += ' WHERE user_id = ? AND status = ?'
    values.push(userId)
    values.push(mode)
  }

  if (limit) {
    query += ' ORDER BY RAND() LIMIT ?'
    values.push(limit)
  }

  return new Promise((resolve, reject) => {
    mysql.query(query, values, (err, results) => {
      if (err) {
        return reject('Error fetching limited user stats lines : ' + err);
      }
      resolve(results);
    });
  });
};

// Function to one limited element among kanji or vocabulary
const getLimitedUserElement = (mysql, id, level, type) => {
  let query = 'SELECT * FROM'
  if (type === 'vocabulary') {
    query += ' vocabulary'
  } else if (type === 'kanji') {
    query += ' kanji'
  }

  query += ' WHERE id = ? AND level = ?'

  return new Promise((resolve, reject) => {
    mysql.query(query, [id, level], (err, results) => {
      if (err) {
        return reject('Error fetching user selected element : ' + err);
      }
      resolve(results[0]);
    });
  });
}

// Function to get a prpfil information by its id
const getUserProfil = (mysql, userId) => {
  const query = 'SELECT id, pro_id, email, name, nickname, role, token, plan, plan_grade, ads, pending, reported FROM user WHERE id = ?'

  return new Promise((resolve, reject) => {
    mysql.query(query, [userId], (err, results) => {
      if (err) {
        return reject('Error fetching user profil: ' + err);
      }
      resolve(results[0])
    })
  })
}

// Function to get the pro profil of an user by its id
const getProProfil = (mysql, proId, role) => {
  let query = 'SELECT '
  if (role === 'pro') {
    query += 'id, plan, phone, is_boosted, students_number, start_plan, end_plan, active, reported FROM pro WHERE id = ?'
  } else if (role === 'user') {
    query += 'id, nickname FROM user WHERE pro_id = ? AND role = "pro"'
  }

  return new Promise((resolve, reject) => {
    mysql.query(query, [proId], (err, results) => {
      if (err) {
        return reject('Error fetching pro user profil: ' + err);
      }
      resolve(results[0])
    })
  })
}

// Function to get all the students of a pro by its id
const getProStudentsProfil = (mysql, proId) => {
  let query = 'SELECT id, nickname, token, plan, plan_grade, reported FROM user WHERE pro_id = ? AND role = "user"'

  return new Promise((resolve, reject) => {
    mysql.query(query, [proId], (err, results) => {
      if (err) {
        return reject('Error fetching pro user profil: ' + err);
      }
      resolve(results)
    })
  })
}


module.exports = { getExistingStat, getLimitedUserElement, getLimitedUserStatsLines, getProProfil, getProStudentsProfil, getUserProfil, insertNewStat, insertNewGlobalStat, updateStat }