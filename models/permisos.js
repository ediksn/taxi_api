'use strict'

import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types

const PermisosSchema = new Schema({
    ruta      : { type: String, required: true },
    accion     : []
    })
  
  export default mongoose.model('Permisos', PermisosSchema)