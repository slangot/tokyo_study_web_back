require('dotenv').config();
const express = require('express');
const mysql = require('../db-config');
const router = express.Router();
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

// Calculate Token with jwt
const calculateToken = (email = '') => {
  return jwt.sign({ log: email }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '1800s'
  })
}

// //Get token from req
const getToken = req => {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(' ')[0] === 'Bearer'
  ) {
    return req.headers.authorization.split(' ')[1]
  } else if (req.query && req.query.token) {
    return req.query.token
  }
  return null
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email or password missing' });
  }
  try {
    const userFetch = 'SELECT * FROM user WHERE email = ?';
    mysql.query(userFetch, [email], async (err, result) => {
      if (err) {
        res.status(501).json({ error: 'Error retrieving user' });
      } else {
        const data = result[0]
        const hashedPassword = data.password
        bcrypt.compare(password, hashedPassword).then((isValid) => {
          if (!isValid) {
            return res.status(502).send('Wrong password')
          } else {
            const userData = {
              id: data.id,
              pro_id: data.pro_id,
              name: data.name,
              nickname: data.nickname,
              email: data.email,
              role: data.role,
              token: data.token,
              connectionToken: calculateToken(data.email)
            }
            res.status(200).json({ data: userData })
          }
        })
      }
    })
  } catch (err) {
    console.error(err)
  }
})

// post route with a jwt token checking
router.post('/protected', (req, res) => {
  const token = getToken(req)
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send('Error')
    }
    return res.status(200).send('Success')
  })
})

module.exports = router