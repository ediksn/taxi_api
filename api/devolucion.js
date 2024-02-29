'use strict'

import { Dev } from '../models'
import Debug from 'debug'
import { Login } from '../services'
var moment = require('moment');

const debug = new Debug('taxi:server:api:devoluciones')

export default {
  find: () => {
    debug(`Finding devoluciones for homepage with limit.`)
    return Dev.find().populate('chofer').populate('cliente').populate('reserva')
  },

  findById: (_id) => {
    debug(`Find devoluciones with id: ${_id}`)
    return Dev.findById(_id)
  },

  create: (q) => {
    debug(`Creating new devolucion`)
    const dev = new Dev(q)
    return dev.save()
  },

  update: (q) => {
    debug(`Updating the devolucion with id: ${q._id}`)
    return Dev.findByIdAndUpdate({ _id: q._id }, { $set: q },{new:true}).populate('cliente').populate('chofer')
  },

  delete: (_id) => {
    debug(`Removing the devolucion with id: ${_id}`)
    return Dev.findOneAndRemove({ _id })
  }
}