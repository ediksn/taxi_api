'use strict'

import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types

const ClienteSchema = new Schema({
    nombre      : { type: String, required: true },
    apellido    : { type: String, required: true },
    identificacion : String,
    direccion      : [],
    tarjetas       : [],
    imagen         : {},
    tarjeta_tmp    : {},
    telefono    : String,
    viajes      : [],
    fecha_nac   : Date,
    map         : {
      lat: { type: Number}, 
      lng: { type: Number}      
    },     
    email       : { type: String , required: true },
    password    : { type: String ,required: true },
    createdAt   : { type: Date, default: Date.now, required: true },
    saldo       : Number,
    bloquedo    : Number,
    tipo_def    : String,
    fcmtoken  : String,
    estatus   : String,
    firebase_id : String,
    codigo_pass : String,
    fecha_codigo: Date,
    web: {type: ObjectId, ref:'Usuario'}
    })
  
  export default mongoose.model('Cliente', ClienteSchema)
  
