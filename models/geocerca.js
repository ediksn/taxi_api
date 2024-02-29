'use strict'

import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types
const ChoferSchema = new Schema({

}) 

const GeocercaSchema = new Schema({
    nombre          : String,
    costo_destino   : Number,
    costo_salida    : Number,
    choferes        : [{type: ObjectId, ref:'Chofer'}],
    perimetro       : Number,
    polygono        : [],
    costo_destino_m : Number,
    costo_salida_m  : Number,
})
  
export default mongoose.model('Geocerca', GeocercaSchema)