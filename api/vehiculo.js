'use strict'

import { Vehiculo } from '../models'
import Debug from 'debug'
import { Login } from '../services'

const debug = new Debug('taxi:server:api:vehiculo')

export default {
  find: () => {
    debug(`Finding Vehiculos for homepage with limit.`)
    return Vehiculo.find().sort('nombre')
  },

  findById: (_id) => {
    debug(`Find Vehiculo with id: ${_id}`)
    return Vehiculo.findById(_id)
  },

  findByOwner: (d)=>{
      debug( `Find vehiculos with owner: ${d}`)
      return Vehiculo.findOne({owner:d})
  },

  create: (q) => {
    debug(`Creating new Vehiculo`)
    return Vehiculo.findOne({placa:q.placa})
    .then(function(vehiculo){
      if(vehiculo)
        return {message:'El vehiculo ya existe'}
      else{
        const vehiculo = new Vehiculo(q)
        return vehiculo.save()
      }
    })
  },

  update: (q) => {
    debug(`Updating the vehiculo with id: ${q._id}`)
    return Vehiculo.updateOne({ _id: q._id }, { $set: q })
  },

  delete: (_id) => {
    debug(`Removing the vehiculo with id: ${_id}`)
    return Vehiculo.findOneAndRemove({ _id })
  },

  DeleteOwner: (d)=>{
    debug( `Find vehiculos with owner: ${d}`)
    return Vehiculo.findOneAndRemove({owner:d})
  }
}