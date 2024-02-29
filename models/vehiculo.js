'use strict'

import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types

const VehiculoSchema = new Schema({
    modelo      : { type: String, required: true },
    marca       : { type: String, required: true },
    placa       : { type: String, required: true },
    puestos     : Number,
    estatus     : String,
    owner       : { type: ObjectId, ref: 'Chofer', required: true },
    extras      : [],
    images      : [],
    color       : String,
    tipo        : String
    })
  
  export default mongoose.model('Vehiculo', VehiculoSchema)
  
