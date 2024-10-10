const auth = require('./auth')
const egs = require('./exercice_global_stats')
const es = require('./exercice_stats')
const jlpt = require('./jlpt')
const kanji = require('./kanji')
const kanji_keys = require('./kanji_keys')
const pro = require('./pro')
const uqa = require('./user_question_answer')
const sentence = require('./sentence')
const story = require('./story')
const vocabulary = require('./vocabulary')
const user = require('./user')

module.exports = { auth, egs, es, jlpt, kanji, kanji_keys, pro, uqa, sentence, story, vocabulary, user }