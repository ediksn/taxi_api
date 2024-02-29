'use strict'

import { Secuencia } from '../models'
import Debug from 'debug'
import { Login } from '../services'
var moment = require('moment');

const debug = new Debug('taxi:server:api:retiros')

export default {
  find: () => {
    debug(`Finding Secuencia for homepage with limit.`)
    return Secuencia.find().sort('nombre').populate('chofer')
  },

  findSec: () => {
    debug(`Finding Secuencia for homepage with limit.`)
    let sec = Secuencia.find().sort({$natural:-1}).limit(1)
    if(sec.size===0){
      Secuencia.create({secuencia:0})
      return Secuencia.find().sort({$natural:-1}).limit(1);
    }
    else{
      return Secuencia.find().sort({$natural:-1}).limit(1);
    }
  },

  findById: (_id) => {
    debug(`Find Secuencia with id: ${_id}`)
    return Secuencia.findById(_id)
  },

  create: (q) => {
    debug(`Creating new Secuencia`)
    const secuencia = new Secuencia(q)
    return secuencia.save()
  },

  update: (q) => {
    debug(`Updating the secuencia with id: ${q._id}`)
    return Secuencia.updateOne({ _id: q._id }, { $set: q })
  },

  delete: (_id) => {
    debug(`Removing the secuencia with id: ${_id}`)
    return Secuencia.findOneAndRemove({ _id })
  }
}