'use strict'

import { Tipo } from '../models'
import Debug from 'debug'
import { Login } from '../services'

const debug = new Debug('taxi:server:api:tipo_pago')

export default {
  find: () => {
    debug(`Finding Tipo pagos for homepage with limit.`)
    return Tipo.find().sort('nombre')
  },

  findById: (_id) => {
    debug(`Find Tipo pago with id: ${_id}`)
    return Tipo.findById(_id)
  },

  create: (q) => {
    debug(`Creating new Tipo pago`)
    const tipo = new Tipo(q)
    return tipo.save()
  },

  update: (q) => {
    debug(`Updating the tipo with id: ${q._id}`)
    return Tipo.updateOne({ _id: q._id }, { $set: q })
  },

  delete: (_id) => {
    debug(`Removing the tipo with id: ${_id}`)
    return Tipo.findOneAndRemove({ _id })
  }
}