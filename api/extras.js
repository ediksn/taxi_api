'use strict'

import { Extra } from '../models'
import Debug from 'debug'
import { Login } from '../services'

const debug = new Debug('taxi:server:api:extras')

export default {
  find: () => {
    debug(`Finding Extras for homepage with limit.`)
    return Extra.find().sort('nombre')
  },

  findById: (_id) => {
    debug(`Find Extra with id: ${_id}`)
    return Extra.findById(_id)
  },

  create: (q) => {
    debug(`Creating new Extra`)
    const extra = new Extra(q)
    return extra.save()
  },

  update: (q) => {
    debug(`Updating the extra with id: ${q._id}`)
    return Extra.updateOne({ _id: q._id }, { $set: q })
  },

  delete: (_id) => {
    debug(`Removing the extra with id: ${_id}`)
    return Extra.findOneAndRemove({ _id })
  }
}