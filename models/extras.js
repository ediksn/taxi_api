'use strict'

import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types

const ExtrasSchema = new Schema({
    nombre      : { type: String, required: true },
    estatus     : String
    })
  
  export default mongoose.model('Extra', ExtrasSchema)
  
