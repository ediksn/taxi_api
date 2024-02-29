'use strict'

import { Reserva } from '../models'
import Debug from 'debug'
import { Login } from '../services'
var moment = require('moment');

const debug = new Debug('taxi:server:api:reserva')

export default {
  find: () => {
    debug(`Finding Reservas for homepage with limit.`)
    return Reserva.find().sort('nombre')
    .populate({path:'driver', populate: {path: 'vehiculo'}})
    .populate('user')
    .sort({'fecha':-1})
  },

  findFin: () => {
    debug(`Finding Reservas for homepage with limit.`)
    return Reserva.find({
      $and:[{
        driver:{ $exists: true}, 
        estatus: 'Terminado', 
        user:{ $exists: true},
        fecha:{ $gte: moment().startOf('day'), $lt : moment().endOf('day')}
      }],
      $or:[
        { comen_cli:{ $exists : true} },
        { comen_dri:{ $exists : true} }
      ]
    })
    .sort('nombre')
    .populate({path:'driver', populate: {path: 'vehiculo'}})
    .populate('user')
    .sort({'fecha':-1})
  },

  findHoy: () => {
    debug(`Finding Reservas for homepage with limit.`)
    return Reserva
    .find({
      fecha:{ $gte: moment().startOf('day'), $lt : moment().endOf('day')}
    })
    .populate({path:'driver', populate: {path: 'vehiculo'}})
    .populate('user')
    .sort({'fecha':-1})
  },

  findById: (_id) => {
    debug(`Find Reserva with id: ${_id}`)
    return Reserva.findById(_id)
    .populate({path:'driver', populate: {path: 'vehiculo'}})
    .populate('user')
    .populate('trans_id')
  },

  findByClient: (user) => {
    debug(`Find Reserva with id: ${user}`)
    return Reserva.find({user:user})
    .populate({path:'driver', populate: {path: 'vehiculo'}})
    .populate('user')
    .populate('trans_id')
    .sort({'fecha':-1})
  },

  findByDriver: (driver) => {
    debug(`Find reserva with id: ${driver}`)
    return Reserva.find({driver:driver})
    .populate({path:'driver', populate: {path: 'vehiculo'}})
    .populate('user')
    .populate('trans_id')
    .sort({'fecha':-1})
  },

  findId: () => {
    return Reserva.find({id_num: {$exists:true}})
    .populate({path:'driver', populate: {path: 'vehiculo'}})
    .populate('user')
    .populate('trans_id')
    .sort({'id_num':-1})
  },

  findFechas2:(x,y)=>{
    return Reserva
    .find({
      fecha:{ $gte: moment(x).startOf('day'), $lt : moment(y).endOf('day')}
    })
    .populate({path:'driver', populate: {path: 'vehiculo'}})
    .populate('user')
    .sort({'fecha':-1})
  },

  findFechasFin:(x,y)=>{
    return Reserva
    .find({
      $and:[{
        driver:{ $exists: true}, 
        estatus: 'Terminado', 
        user:{ $exists: true},
        fecha:{ $gte: moment(x).startOf('day'), $lt : moment(y).endOf('day')}
      }],
      $or:[
        { comen_cli:{ $exists : true} },
        { comen_dri:{ $exists : true} }
      ]
    })
    .populate({path:'driver', populate: {path: 'vehiculo'}})
    .populate('user')
    .sort({'fecha':-1})
  },

  findFechas:(x,y)=>{
    y = moment(y).add(24, 'hours');
    return Reserva.find({'fecha':{$gte: new Date(x), $lte: new Date(y)}})
    .populate({path:'driver', populate: {path: 'vehiculo'}})
    .populate('user')
  },
  create: (q) => {
    // console.log('---------Creacion de Reserva------------')
    // console.log(q)
    // console.log('---------*******************------------')
    const reserva = new Reserva(q)
    return reserva.save()
  },

  update: (q) => {
    debug(`Updating the reserva with id: `)
    return Reserva.findOneAndUpdate({ _id: q._id }, { $set: q },{new: true})
  },

}