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
        const saltRounds = 10
        const passwordEncrypted = await bcrypt.hash(password, saltRounds)
        console.log('hashedPassword : ', hashedPassword)
        console.log('passwordEncrypted : ', passwordEncrypted)
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
              token: calculateToken(data.email)
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