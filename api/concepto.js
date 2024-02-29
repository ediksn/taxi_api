'use strict'

import { Concepto } from '../models'
import Debug from 'debug'
import { Login } from '../services'

const debug = new Debug('taxi:server:api:conceptos')

export default {
  find: () => {
    debug(`Finding conceptos for homepage with limit.`)
    return Concepto.find().sort('nombre')
  },

  findById: (_id) => {
    debug(`Find concepto with id: ${_id}`)
    return Concepto.findById(_id)
  },

  create: (q) => {
    debug(`Creating new concepto`)
    const concepto = new Concepto(q)
    return concepto.save()
  },

  update: (q) => {
    debug(`Updating the concepto with id: ${q._id}`)
    return Concepto.updateOne({ _id: q._id }, { $set: q })
  },

  delete: (_id) => {
    debug(`Removing the Concepto with id: ${_id}`)
    return Concepto.findOneAndRemove({ _id })
  }
}