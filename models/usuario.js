'use strict'

import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types

const UsuarioSchema = new Schema({
    nombre      : { type: String, required: true },
    apellido    : { type: String, required: true },
    identificacion : String,
    direccion      : [],
    rol            : {type: String},
    imagen         : { type: String },
    telefono    : [],
    permisos    : [],
    email       : { type: String , required: true },
    password    : { type: String , required: true },
    createdAt   : { type: Date, default: Date.now, required: true }
    })
  
  export default mongoose.model('Usuario', UsuarioSchema)
  
