'use strict'

import { Cliente } from '../models'
import Debug from 'debug'
import { Login } from '../services'

const debug = new Debug('taxi:server:api:cliente')

export default {
  find: () => {
    debug(`Finding Clientes for homepage with limit.`)
    return Cliente.find().sort('nombre')
  },

  findById: (_id) => {
    debug(`Find Cliente with id: ${_id}`)
    return Cliente.findById(_id)
  },

  create: (q) => {
    debug(`Creating new Cliente`)
    return Cliente.findOne({telefono:q.telefono})
    .then(function(cliente){
      if(cliente)
        return {message:'El cliente ya existe'}
      else{
        const cliente = new Cliente(q)
        return cliente.save()
      }
    })
  },

  loginCliente: (q) => {
    return Cliente.findOne({ telefono: q.telefono})
    .then(function(cliente){
      let status;
      if (!cliente){
        console.log('El usuario no existe')
        status = 'user'
        return status
      }
      else if(cliente.password!=q.password){
        console.log('Contraseña incorrecta')
        status = 'pass' 
        return status
      }
      else if(cliente.estatus==='Bloqueado'){
        return null
      }
      else{
        return cliente
      }
    })
  },
  token: async (user) => {
    let token = await Login.createToken(user, 'Cliente')
    return { status: 'Success', message: 'Te haz logueado Exitosamente', token: token, id: user._id, user: user}
  },

  update: (q) => {
    debug(`Updating the cliente with id: ${q._id}`)
    return Cliente.updateOne({ _id: q._id }, { $set: q })
  },

  returnUpdate:(q)=>{
    return Cliente.findOneAndUpdate({_id:q._id},{$set:q},{new:true})
  },

  returnUpdateByEmail:(q)=>{
    return Cliente.findOneAndUpdate({email:q.email},{$set:q},{new:true})
  },

  delete: (_id) => {
    debug(`Removing the cliente with id: ${_id}`)
    return Cliente.findOneAndRemove({ _id })
  },
  deleteweb: (_id) => {
    debug(`Removing the cliente with id: ${_id}`)
    return Cliente.findOneAndRemove({web: _id })
  }
}