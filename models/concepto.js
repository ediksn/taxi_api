'use strict'

import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types

const ConceptoSchema = new Schema({
    nombre      : { type: String, required: true }
    })
  
  export default mongoose.model('Concepto', ConceptoSchema)
  
