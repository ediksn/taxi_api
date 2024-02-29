'use strict'

import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types

const ConsultaSchema = new Schema({
    user: { type: ObjectId, ref: 'Cliente'},
    enviados: {},
    recibidos: {},
    fecha: {type: Date, required: true, default: Date.now},
})
  
export default mongoose.model('Consultas', ConsultaSchema)
  