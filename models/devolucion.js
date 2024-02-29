'use strict'

import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types

const DevolucionSchema = new Schema({
    fecha    : {type: Date, required: true, default: Date.now},
    cliente  : {type: ObjectId, ref: 'Cliente'},
    chofer   : {type: ObjectId, ref: 'Chofer'},
    reserva  : {type: ObjectId, ref: 'Reserva'},
    descripcion  : String,
    nota  : String,
    estatus  : {type:String, default: 'Pendiente'},
    total    : Number,
})
  
export default mongoose.model('Dev', DevolucionSchema)