'use strict'

import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types

const CliSchema = new Schema({
  clientes      : {type: ObjectId, ref:'Cliente'},
  entregado     : String
})

const ChoSchema = new Schema({
  choferes      : {type: ObjectId, ref:'Chofer'},
  entregado     : String
})

const NotificacionesSchema = new Schema({
    titulo        : String,
    cuerpo        : String,
    clientes      : [CliSchema],
    choferes      : [ChoSchema],
    createdAt     : { type: Date, default: Date.now, required: true },
    vista         : {type:Boolean, default:false}
    })
  
  export default mongoose.model('Notificaciones', NotificacionesSchema)
  
