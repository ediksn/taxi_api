'use strict'

import { Geocerca } from '../models'
import Debug from 'debug'
import { Login } from '../services'

const debug = new Debug('taxi:server:api:extras')

export default {
  find: () => {Geocerca
    debug(`Finding Extras for homepage with limit.`)
    return Geocerca.find().sort('nombre')
  },

  findById: (_id) => {
    debug(`Find Geocerca with id: ${_id}`)
    return Geocerca.findById(_id)
  },

  create: (q) => {
    debug(`Creating new Geocerca`)
    const geocerca = new Geocerca(q)
    return geocerca.save()
  },

  searchChof: (_id) => {
    debug(`Updating the Geocerca with id: ${_id}`)
    return Geocerca.find({choferes:{$all:[_id]}})
  },

  update: (q) => {
    debug(`Updating the Geocerca with id: ${q._id}`)
    return Geocerca.updateOne({ _id: q._id }, { $set: q })
  },

  delete: (_id) => {
    debug(`Removing the Geocerca with id: ${_id}`)
    return Geocerca.findOneAndRemove({ _id })
  }
}