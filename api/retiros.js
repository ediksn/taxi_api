'use strict'

import { Retiros } from '../models'
import Debug from 'debug'
import { Login } from '../services'
var moment = require('moment');

const debug = new Debug('taxi:server:api:retiros')

export default {
  find: () => {
    debug(`Finding Retiros for homepage with limit.`)
    return Retiros.find().sort('nombre').populate('chofer')
  },

  findById: (_id) => {
    debug(`Find Retiros with id: ${_id}`)
    return Retiros.findById(_id)
  },

  findByChofer:chof=>{
    debug(`Find Retiros with chofer: ${chof}`)
    return Retiros.find({chofer:chof}).sort({fecha:-1})
  },

  create: (q) => {
    debug(`Creating new Retiros`)
    const retiros = new Retiros(q)
    return retiros.save()
  },

  update: (q) => {
    debug(`Updating the retiros with id: ${q._id}`)
    return Retiros.updateOne({ _id: q._id }, { $set: q })
  },

  findFechas:(x,y)=>{
    y = moment(y).add(24, 'hours');
    return Retiros.find({'fecha':{$gte: new Date(x), $lte: new Date(y)}}).populate('chofer')
  },

  delete: (_id) => {
    debug(`Removing the retiros with id: ${_id}`)
    return Retiros.findOneAndRemove({ _id })
  }
}