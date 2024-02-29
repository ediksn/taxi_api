'use strict'

import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types

const RetirosSchema = new Schema({
    id: Number,
    chofer: {type: ObjectId, ref: 'Chofer'},
    monto: Number,
    tipo: String,
    estatus: {type: String, default: 'Pendiente'},
    comentario: String,
    fecha: {type: Date, required: true, default: Date.now},
})
  
export default mongoose.model('Retiros', RetirosSchema)
  