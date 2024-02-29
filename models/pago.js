'use strict'

import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types

const PagosSchema = new Schema({
    info     : []
})
  
export default mongoose.model('Pagos', PagosSchema)