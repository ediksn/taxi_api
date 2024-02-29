'use strict'

import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types

const RutaSchema = new Schema({
    salida      : {type: ObjectId, ref:'Geocerca'},
    llegada     : {type: ObjectId, ref:'Geocerca'},
    precio      : Number,
    ida_vuelta  : Number,
    precio_m    : Number,
    ida_vuelta_m: Number
    })
  
  export default mongoose.model('Ruta', RutaSchema)
  