'use strict'

import { Permisos } from '../models'
import Debug from 'debug'
import { Login } from '../services'

const debug = new Debug('taxi:server:api:permisos')

export default {
  find: () => {
    debug(`Finding Permisos for homepage with limit.`)
    return Permisos.find().sort('nombre')
  },

  findById: (_id) => {
    debug(`Find Permisos with id: ${_id}`)
    return Permisos.findById(_id)
  },

  create: (q) => {
    debug(`Creating new Permisos`)
    const permisos = new Permisos(q)
    return permisos.save()
  },

  update: (q) => {
    debug(`Updating the permisos with id: ${q._id}`)
    return Permisos.updateOne({ _id: q._id }, { $set: q })
  },

  delete: (_id) => {
    debug(`Removing the permisos with id: ${_id}`)
    return Permisos.findOneAndRemove({ _id })
  }
}