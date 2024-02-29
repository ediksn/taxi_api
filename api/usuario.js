'use strict'

import { Usuario } from '../models'
import Debug from 'debug'
import { Login } from '../services'

const debug = new Debug('taxi:server:api:usuario')

export default {
  find: () => {
    debug(`Finding Usuarios for homepage with limit.`)
    return Usuario.find().sort('nombre')
  },

  findById: (_id) => {
    debug(`Find Usuario with id: ${_id}`)
    return Usuario.findById(_id)
  },

  create: (q) => {
    debug(`Creating new Usuario`)
    return Usuario.findOne({email:q.email})
    .then(function(usuario){
      if(usuario)
        return {message:'El usuario ya existe'}
      else{
        const usuario = new Usuario(q)
        return usuario.save()
      }
    })
  },

  loginUsuario: (q) => {
    return Usuario.findOne({ email: q.email})
    .then(function(usuario){
      let status;
      if (!usuario){
        console.log('El usuario no existe')
        status = 'user'
        return status
      }
      else if(usuario.password!=q.password){
        console.log('Contraseña incorrecta')
        status = 'pass' 
        return status
      }
      return usuario
    })
  },
  token: async (user) => {
    let token = await Login.createToken(user, 'Usuario')
    return { status: 'Success', message: 'Te haz logueado Exitosamente', token: token, id: user._id, user: user}
  },

  update: (q) => {
    debug(`Updating the retiros with id: ${q._id}`)
    return Usuario.updateOne({ _id: q._id }, { $set: q })
  },

  // update: (q) => {
  //   debug(`Updating the usuario with id: ${q._id}`)
  //   const { nombre, apellido, identificacion, direccion ,imagen,telefono,email,password,instagram,facebook,twitter,provincia,sector} = q
  //   if (imagen == null || imagen == '') return Usuario.updateOne({ _id: q._id }, { $set: { nombre, apellido, identificacion, direccion ,imagen,telefono,email,password,instagram,facebook,twitter,provincia,sector } })
  //   return Usuario.updateOne({ _id: q._id }, { $set: { nombre, apellido, identificacion, direccion ,imagen,telefono,email,password,instagram,facebook,twitter,provincia,sector } })
  // },

  delete: (_id) => {
    debug(`Removing the usuario with id: ${_id}`)
    return Usuario.findOneAndRemove({ _id })
  }
}