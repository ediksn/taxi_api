'use strict'

import { Consulta } from '../models'
import Debug from 'debug'
import { Login } from '../services'
var moment = require('moment');

const debug = new Debug('taxi:server:api:retiros')

export default {
  find: () => {
    debug(`Finding Consulta for homepage with limit.`)
    return Consulta.find().populate('user')
  },

  findById: (_id) => {
    debug(`Find Consulta with id: ${_id}`)
    return Consulta.findById(_id)
  },

  create: (q) => {
    debug(`Creating new Consulta`)
    const consulta = new Consulta(q)
    return consulta.save()
  },

  update: (q) => {
    debug(`Updating the Consulta with id: ${q._id}`)
    return Consulta.updateOne({ _id: q._id }, { $set: q })
  },

  delete: (_id) => {
    debug(`Removing the Consulta with id: ${_id}`)
    return Consulta.findOneAndRemove({ _id })
  }
}