'use strict'

import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types

const ChoferSchema = new Schema({
    nombre      : { type: String, required: true },
    apellido    : { type: String, required: true },
    identificacion : String,
    fecha_nac      : Date,
    direccion      : [],
    vehiculo        : {type: ObjectId, ref:'Vehiculo'},
    imagen         : {  },
    telefono    : String,
    email       : { type: String , required: true },
    password    : { type: String , required: true },
    createdAt   : { type: Date, default: Date.now, required: true },
    updatedAt   : { type: Date },
    estatus     : String,
    orientacion: Number,
    map: { 
        lat: { type: Number}, 
        lng: { type: Number}
      },
    viajes      : Number,
    valor       : Number,
    saldo       : Number,
    bloqueado   : Number,
    nom_banc    : String,
    tipo_cuenta : String,
    num_cuenta  : String,
    paypal      : String,
    fcmtoken    : String,
    iden        : {},
    licen       : {},
    matricula   : {},
    seguro      : {},
    unidad      : String,
    codigo_pass : String,
    fecha_codigo: Date,
    firebase_id : String           
    })
  
  export default mongoose.model('Chofer', ChoferSchema)
  
