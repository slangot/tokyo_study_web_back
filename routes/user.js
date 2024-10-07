require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();
const bcrypt = require('bcrypt')
const { getProProfil, getProStudentsProfil, getUserProfil } = require('../utils')

router.get('/', (req, res) => {
  // router.get('/vocabulary/:params', (req, res) => {
  // FRONT : https://mydomain.dm/fruit/{"name":"My fruit name", "color":"The color of the fruit"}
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

router.get('/id', (req, res) => {
  const { userId } = req.query;
  const sql = 'SELECT id, email, name, nickname, pending, pro_id, reported, role FROM user WHERE id = ?'
  mysql.query(sql, [userId], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error retrieving specified user' });
    } else {
      res.status(200).send(result);
    }
  })
})

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

router.post('/register', async (req, res) => {
  const { pro_id, name, nickname, email, password, role, plan } = req.body
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  try {
    const saltRounds = 10
    const passwordEncrypted = await bcrypt.hash(password, saltRounds)

    const registerQuery = 'INSERT INTO user (pro_id, name, nickname, email, password, role, token, plan, ads, register_date, pending, last_connection, reported) VALUES (?, ?, ?, ?, ?, ?, 10, ?, 1, NOW(), 1, NULL, 0)'
    const values = [pro_id, name, nickname, email, passwordEncrypted, role, plan]
    mysql.query(registerQuery, values, (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Error creating user' });
      } else {
        res.status(200).send(result);
      }
    })
  } catch (err) {
    console.error(err)
  }
})

router.put('/tokenManager', (req, res) => {
  const { tokenNumber, userId } = req.body
  const query = 'UPDATE user SET token = ? WHERE id = ?'
  mysql.query(query, [parseInt(tokenNumber), parseInt(userId)], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error updating user token' });
    } else {
      res.status(200).send(result);
    }
  })
})

router.put('/plan', (req, res) => {
  const { plan, userId } = req.body
  const query = 'UPDATE user SET plan = ? WHERE id = ?'
  mysql.query(query, [plan, parseInt(userId)], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error updating user plan' });
    } else {
      res.status(200).send(result);
    }
  })
})

router.put('/update', (req, res) => {
})

router.delete('/:id', (req, res) => {
})

module.exports = router