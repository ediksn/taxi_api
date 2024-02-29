'use strict'

import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types

const SecuenciaSchema = new Schema({
    secuencia: Number,
})
  
export default mongoose.model('Secuencia', SecuenciaSchema)
  