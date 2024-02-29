'use strict'

import { Trans } from '../models'
import Debug from 'debug'
import { Login } from '../services'
var moment = require('moment');

const debug = new Debug('taxi:server:api:transaccion')

export default {
  find: () => {
    debug(`Finding Transs for homepage with limit.`)
    return Trans.find().sort('nombre').populate('concepto','nombre').populate('driver').populate('cliente')
  },

  findByReserva: (id) => {
    debug(`Find transaccion with id: ${id}`)
    return Trans.find({reserva:id}).populate('concepto','nombre').populate('driver').populate('cliente')
  },

  findById: (_id) => {
    debug(`Find transaccion with id: ${_id}`)
    return Trans.findById(_id).populate('concepto','nombre').populate('driver').populate('cliente')
  },

  findByConcepto: (id)=>{
    debug(`Find transaccione with concepto ${id}`)
    return Trans.find({concepto:id}).populate('concepto','nombre').populate('driver').populate('cliente')
  },

  create: (q) => {
    debug(`Creating new transaccion`)
    const trans = new Trans(q)
    try {
      console.log('transaccion creada')
      return trans.save()
    } catch (error) {
      console.log(error)
    }
  },

  createMany:(q)=>{
    debug(`Creating multiple transacciones`)
    return Trans.insertMany(q)
  },

  findFechas:(x,y)=>{
    y = moment(y).add(24, 'hours');
    return Trans.find({'fecha':{$gte: new Date(x), $lte: new Date(y)}})
    .populate({path:'driver', populate: {path: 'vehiculo'}})
    .populate('cliente')
  },

  update: (q) => {
    debug(`Updating the transaccion with id: ${q._id}`)
    return Trans.updateOne({ _id: q._id }, { $set: q })
  },

  delete: (_id) => {
    debug(`Removing the transaccion with id: ${_id}`)
    return Trans.findOneAndRemove({ _id })
  }
}