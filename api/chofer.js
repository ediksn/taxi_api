'use strict'

import { Chofer, Settings } from '../models'
import Debug from 'debug'
import { Login } from '../services'
var moment = require('moment');

const debug = new Debug('taxi:server:api:chofer')

export default {
  find: () => {
    debug(`Finding Chofers for homepage with limit.`)
    return Chofer.find().sort('nombre').populate('vehiculo')
  },

  findById: (_id) => {
    debug(`Find Chofer with id: ${_id}`)
    return Chofer.findById(_id).populate('vehiculo')
  },

  create: (q) => {
    debug(`Creating new Chofer`)
    return Chofer.findOne({telefono:q.telefono})
    .then(function(chofer){
      if(chofer)
        return {message:'El chofer ya existe'}
      else{
        const chofer = new Chofer(q)
        return chofer.save()
      }
    })
  },
  findFechas:(x,y)=>{
    y = moment(y).add(24, 'hours');
    desde = moment().subtract(7, 'days').format("YYYY-MM-DDTHH:mm");
    return Chofer.find({'createdAt':{$gte: new Date(x), $lte: new Date(y)}})
  },

  findSeguimiento : async () =>{
    return await Chofer.find({
      updatedAt:{$gte:new Date(new Date().setMinutes(new Date().getMinutes()-5))}
    })
    .populate({
      path:'vehiculo',
    })
    .sort('nombre')
  },

  findClose:async(coords,taxi)=>{
    let settings = await Settings.findOne()
    let chofer
    let distance = settings.perim_cli / 6371 * (Math.PI / 180)
    if(taxi){
      chofer = await Chofer.find({
        estatus:'Disponible', 
        vehiculo:{$exists:true},
        map:{$within:{$centerSphere:[[coords.lat, coords.lng], distance]}},
        updatedAt:{$gte:new Date(new Date().setMinutes(new Date().getMinutes()-5))}
      },{_id: 1, map:1, orientacion:1, vehiculo: 1})
      .populate({
        path:'vehiculo',
        match:{tipo:{$eq:taxi}}
      })
      chofer = chofer.filter(el=>{
        return el.vehiculo
      })
      // console.log('con taxi '+chofer.length)
    }else{
      chofer = await Chofer.find({
        estatus:'Disponible', 
        vehiculo:{$exists:true},
        map:{$within:{$centerSphere:[[coords.lat, coords.lng], distance]}},
        updatedAt:{$gte:new Date(new Date().setMinutes(new Date().getMinutes()-5))}
      },{_id: 1, map:1, orientacion:1, vehiculo: 1})
      .populate('vehiculo')
      chofer = chofer.filter(el=>{
        return el.vehiculo
      })
    }
    // console.log('sin taxi '+chofer.length)
    return chofer
  },

  loginChofer: (q) => {
    return Chofer.findOne({ telefono: q.telefono})
    .then(function(chofer){
      let status;
      if (!chofer){
        console.log('El usuario no existe')
        status = 'user'
        return status
      }
      else if(chofer.password!=q.password){
        console.log('Contraseña incorrecta')
        status = 'pass' 
        return status
      }
      else if(chofer.estatus==='Bloqueado'){
        return null
      }
      else{
        return chofer
      }
    })
  },
  token: async (user) => {
    let token = await Login.createToken(user, 'Chofer')
    return { status: 'Success', message: 'Te haz logueado Exitosamente', token: token, id: user._id, user: user}
  },

  update: (q) => {
    debug(`Updating the chofer with id: ${q._id}`)
    return Chofer.updateOne({ _id: q._id }, { $set: q })
  },

  returnUpdate:(q)=>{
    return Chofer.findOneAndUpdate({_id:q._id},{$set:q},{new:true})
  },

  returnUpdateByEmail:(q)=>{
    return Chofer.findOneAndUpdate({email:q.email},{$set:q},{new:true})
  },

  delete: (_id) => {
    debug(`Removing the chofer with id: ${_id}`)
    return Chofer.findOneAndRemove({ _id })
  }
}