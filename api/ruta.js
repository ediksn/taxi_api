'use strict'

import { Ruta } from '../models'
import Debug from 'debug'
import { Login } from '../services'

const debug = new Debug('taxi:server:api:rutas')

export default {
  find: () => {
    debug(`Finding Rutas for homepage with limit.`)
    return Ruta.find().sort('nombre')
  },

  findall: (id) => {
    debug(`Finding Rutas for homepage with limit.`)
    return Ruta.find({$or:[{salida:{$all:[id]}}, {llegada:{$all:[id]}}]})
  },

  findById: (_id) => {
    debug(`Find Ruta with id: ${_id}`)
    return Ruta.findById(_id)
  },

  create: (q) => {
    debug(`Creating new Ruta`)
    const ruta = new Ruta(q)
    return ruta.save()
  },

  update: (q) => {
    debug(`Updating the ruta with id: ${q._id}`)
    return Ruta.updateOne({ _id: q._id }, { $set: q })
  },

  delete: (_id) => {
    debug(`Removing the ruta with id: ${_id}`)
    return Ruta.findOneAndRemove({ _id })
  }
}