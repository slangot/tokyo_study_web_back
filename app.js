const express = require('express')
const connection = require('./db-config')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
const routes = require('./routes/index')

const port = process.env.PORT || 3001
app.use(express.json())

connection.connect(err => {
  if (err) {
    console.error('error connecting: ' + err.stack)
  } else {
    console.log('connected as id ' + connection.threadId)
  }
})

const allowedOrigins = ['http://tsw.konecton.com', 'https://tsw.konecton.com']

const corsOptions = {
  origin: function (origin, callback) {
    console.log('ORIGIN : ', origin)
    if (!origin || allowedOrigins.includes(origin)) {
      console.log('ORIGIN ACCEPTED')
      callback(null, true)
    } else {
      callback(new Error('UnauthorizedError'))
    }
  },
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

app.use(morgan('tiny'))
app.use(express.urlencoded({ extended: true }))

app.use('/kanji', routes.kanji)
app.use('/vocabulary', routes.vocabulary)
app.use('/sentence', routes.sentence)

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})

app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(403).json({ error: 'Unauthorized' });
  } else {
    next(err);
  }
});