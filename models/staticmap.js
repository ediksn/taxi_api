const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AlertasSchema = new Schema({
    url: String,
    fecha: { type: Date, default: Date.now() },
})

module.exports = mongoose.model('Staticmap', AlertasSchema)