require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();
const bcrypt = require('bcrypt')
const { getProProfil, getProStudentsProfil, getUserProfil } = require('../utils');
// const { sendEmail } = require('../mail');

/**
 * Route to fetch users by role
 * @method GET 
 * @route '/user'
 * @request QUERY
 * @param {string} role - User role
 */
router.get('/', (req, res) => {
  const { role } = req.query;
  let sql = 'SELECT * FROM user';

  if (role) {
    sql += ` WHERE role = ${role}`;
  }

  mysql.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error retrieving users' });
    } else {
      res.status(200).send(result);
    }
  });
})

/**
 * Route to count the users by role
 * @method GET 
 * @route '/user/count'
 * @request QUERY
 * @param {string} role - User role
 */
router.get('/count', (req, res) => {
  const { role } = req.query;
  let sql = 'SELECT COUNT(*) AS count FROM user';
  if (role) {
    sql += ` WHERE role = "${role}"`;
  }

  mysql.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error retrieving users count' });
    } else {
      res.status(200).json(result[0]);
    }
  });
})

/**
 * Route to fetch an user by its id
 * @method GET 
 * @route '/user/id'
 * @request QUERY
 * @param {number} userId - User ID
 */
router.get('/id', (req, res) => {
  const { userId } = req.query;
  const sql = 'SELECT id, email, name, nickname, validate_account, pro_id, reported, role FROM user WHERE id = ?'
  mysql.query(sql, [userId], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error retrieving specified user' });
    } else {
      res.status(200).send(result);
    }
  })
})

/**
 * Route to fetch the complete profil of an user by its id
 * @method GET 
 * @route '/user/profil'
 * @request QUERY
 * @param {number} id - User ID
 */
router.get('/profil', async (req, res) => {
  const { id } = req.query

  try {
    const userProfil = await getUserProfil(mysql, id)
    const result = []
    if (!userProfil) {
      res.status(404).json({ error: 'Error getting user with this id' });
    } else {
      result.push(userProfil)
      if (userProfil.pro_id) {
        const proProfil = await getProProfil(mysql, userProfil.pro_id, userProfil.role)
        result.push(proProfil)
        if (userProfil.role === 'pro') {
          const studentsProfil = await getProStudentsProfil(mysql, userProfil.pro_id)
          const students = {
            students: studentsProfil
          }
          result.push(students)
        }
      }
      res.status(200).json(result)
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
})

/** ----- WIP -----
 * 
 * Route to confirm the registration email by validated the pending_token
 * @method GET 
 * @route '/user/email-validation'
 * @request QUERY
 * @param {string} emailValidation - Email token validation
 */
router.post('/email-validation', async (req, res) => {
  const { emailValidation } = req.query

  const checkEmailToken = (token) => {
    const sql = 'SELECT id, pending_token WHERE pending_token = ?'

    return new Promise((resolve, reject) => {
      mysql.query(sql, [token], (err, results) => {
        if (err) {
          return reject('Error retrieving specified awaited user : ' + err);
        }
        resolve(results);
      });
    });
  }

  const updateValidateAccount = (id) => {
    const sql = 'UPDATE user SET validate_account = 1 WHERE id = ?'

    return new Promise((resolve, reject) => {
      mysql.query(sql, [id], (err, results) => {
        if (err) {
          return reject('Error validate awaited user : ' + err);
        }
        resolve(results);
      });
    });
  }

  try {
    const userPendingProfil = await checkEmailToken(emailValidation)
    if (!userPendingProfil) {
      res.status(404).json({ error: 'Error retrieving specified awaited user' });
    } else {
      if (userPendingProfil.id) {
        res.status(404).json({ error: 'Error retrieving specified awaited user' });
      }
      const updatedProfil = await updateValidateAccount(userPendingProfil.id)
      if (!updatedProfil) {
        res.status(404).json({ error: 'Error updating awaited user' });
      } else {
        res.status(200).json(updatedProfil)
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
})

// router.post('/testemail', async (req, res) => {
//   const { email } = req.body

//   const saltRounds = 1
//   const pendingToken = await bcrypt.hash('account is pending to validation', saltRounds)

//   const mailOptions = {
//     from: process.env.MAILER_USER,
//     to: email,
//     subject: 'Valider votre compte Tokyo Study',
//     html: `<body style="text-align: center; width: 100vw; height: 100vh; margin: 20px auto; padding: 20px 0px;">
//     <p>Cliquez sur le bouton ci-dessous pour valider pour compte</p>
//     <a style="padding: 20px 10px; background-color: blue; color: white" href="https://tsw.konecton.com/account-validate?pts=${pendingToken}">Valider mon compte</a>
//     </body>`,
//   }
//   await sendEmail(mailOptions);
//   // res.status(200).send(result);
// })

/**
 * Route to register an user
 * @method POST 
 * @route '/user/register'
 * @request BODY
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} nickname - User nickname
 * @param {string} password - User password
 * @param {string} plan - User plan
 * @param {string} planGrade - User plan grade
 * @param {string} preferences - User preferences
 * @param {number} proId - Pro ID
 * @param {string} role - User role
 */
router.post('/register', async (req, res) => {
  const { email, name, nickname, password, plan, planGrade, preferences, proId, role } = req.body

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  try {
    const saltRounds = 10
    const passwordEncrypted = await bcrypt.hash(password, saltRounds)
    const pendingToken = await bcrypt.hash('account is pending to validation', 1)

    const registerQuery = 'INSERT INTO user (pro_id, name, nickname, email, password, role, preferences, tokens, daily_tokens, plan, plan_grade, ads, register_date, validate_account, pending_token, last_connection, reported) VALUES (?, ?, ?, ?, ?, ?, ?, 10, 10, ?, ?, 1, NOW(), 0, ?, NULL, 0)'
    const values = [proId, name, nickname, email, passwordEncrypted, role, preferences, plan, planGrade, pendingToken]
    mysql.query(registerQuery, values, async (err, result) => {
      if (err) {
        console.error(err)
        res.status(500).json({ error: 'Error creating user' });
      } else {
        // const mailOptions = {
        //   from: process.env.MAILER_USER,
        //   to: email,
        //   subject: 'Valider votre compte Tokyo Study',
        //   html: `<body style="text-align: center; width: 100vw; height: 100vh; margin: 20px auto; padding: 20px 0px;">
        //   <p>Cliquez sur le bouton ci-dessous pour valider pour compte</p>
        //   <a style="padding: 20px 10px; background-color: blue; color: white" href="https://tsw.konecton.com/account-validate?pts=${pendingToken}">Valider mon compte</a>
        //   </body>`,
        // }
        // sendEmail(mailOptions);
        res.status(200).send(result);
      }
    })
  } catch (err) {
    console.error(err)
  }
})

/**
 * Route to update user tokens
 * @method PUT 
 * @route '/user/tokenManager'
 * @request BODY
 * @param {number} tokenNumber - Tokens
 * @param {number} userId - User ID
 */
router.put('/tokenManager', (req, res) => {
  const { tokenNumber, userId } = req.body
  const query = 'UPDATE user SET tokens = ? WHERE id = ?'
  mysql.query(query, [parseInt(tokenNumber), parseInt(userId)], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error updating user token' });
    } else {
      res.status(200).send(result);
    }
  })
})

/**
 * Route to update user plan
 * @method PUT 
 * @route '/user/plan'
 * @request BODY
 * @param {number} dailyTokens - Daily tokens
 * @param {string} plan - User plan
 * @param {string} planGrade - User plan grade
 * @param {number} userId - User ID
 */
router.put('/plan', (req, res) => {
  const { dailyTokens, plan, planGrade, userId } = req.body
  const query = 'UPDATE user SET plan = ?, plan_grade = ?, daily_tokens = ? WHERE id = ?'
  mysql.query(query, [plan, planGrade, parseInt(dailyTokens), parseInt(userId)], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error updating user plan' });
    } else {
      res.status(200).send(result);
    }
  })
})

/**
 * Route to update user informations
 * @method PUT 
 * @route '/user/update'
 * @request BODY
 * @request QUERY
 * @param {object} otherColumns - User informations to update
 * @param {number} id - User ID
 */
router.put('/update', (req, res) => {
  const { id } = req.query;
  const { ...otherColumns } = req.body
  const updateColumn = async (id, columnName, columnValue) => {
    const saltRounds = 10
    let passwordEncrypted
    let columnValueToUpdate = columnValue
    if (columnName === 'password') {
      passwordEncrypted = await bcrypt.hash(columnValue, saltRounds)
      columnValueToUpdate = passwordEncrypted
    }

    return new Promise((resolve, reject) => {
      const sql = `UPDATE user SET ${columnName} = ? WHERE id = ?`;
      const sqlValues = [columnValueToUpdate, id];
      mysql.query(sql, sqlValues, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };

  const updatePromises = Object.entries(otherColumns).map(([columnName, columnValue]) => {
    if (columnValue) {
      return updateColumn(id, columnName, columnValue);
    }
  });

  Promise.all(updatePromises)
    .then(results => {
      res.status(200).json(results);
    })
    .catch(err => {
      res.status(500).send('Error updating the profile');
    });
})

router.delete('/:id', (req, res) => {
})

module.exports = router