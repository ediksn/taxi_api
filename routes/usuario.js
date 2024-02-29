'use strict'

import express from 'express'
import multer from 'multer'
import { Login } from '../services'
import { Auth } from '../middleware'
import { Usuario, Cliente } from '../api'
import { handleError } from '../Utils'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/images/usuario/')
    },
    filename: function (req, file, cb) {
      console.log(file);
      const fileObj = {
        "image/png": ".png",
        "image/jpeg": ".jpeg",
        "image/jpg": ".jpg"
      };
      if (fileObj[file.mimetype] == undefined) {
        cb(new Error("file format not valid"));
      } else {
        cb(null, file.fieldname + '-' + Date.now() + fileObj[file.mimetype])
      }
    }
  })
  
  const upload = multer({storage: storage})
  const app = express.Router()
  
  app.get('/', Auth.isUsuario, async (req, res) => {
    try {
      const data = await Usuario.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun usuario'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/refresh', Auth.isUsuario, async (req, res) => {
      const token = req.headers.authorization.split(' ')[1]
      Login.decodeTokenPer(token)
      .then(response => {
      Usuario.findById(response.sub)
      .exec({}, (err, user) => {
        if (err) { 
          res.status(500).send({message: `Error al borrar el producto: ${err}`}) 
        } else {
          res.status(200).send({
            usuario: user
          })
        }
      })
    })
  })

  app.get('/admin', Auth.isUsuario, Auth.permisos(['Asignación de Permisos'],'Ver'), async (req, res) => {
    try {
      const data = await Usuario.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun usuario'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })
  
  app.get('/:id', Auth.isUsuario, async (req, res) => {
    try {
      const data = await Usuario.findById(req.params.id)
      if(!data)
        res.status(404).json({message:`No existe el usuario con el id ${req.params.id}`})
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })
  
  app.post('/', Auth.isUsuario , Auth.permisos(['Asignación de Permisos'],'Modificar'), upload.single('imagen'), async (req, res) => {
  
    try {
      const data = await Usuario.create(req.body)
      res.status(201).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/login', async (req, res) => {
    try {
      const usuario = await Usuario.loginUsuario(req.body)
      if(usuario == 'user') {
        res.status(200).json({ status: 'denied', message: 'Usuario no existe'})
      }
      else if(usuario == 'pass'){
        res.status(200).json({ status: 'denied', message: 'Contraseña invalida'})
      }
      else{
        const token = await Usuario.token(usuario)
        res.status(201).json(token)
      }
    } catch (error) {
      handleError(error, res)
    }
})
  
  app.put('/', Auth.isUsuario ,  async (req, res) => {
    try {
      // console.log(req.body)
      const data = await Usuario.update(req.body)
      res.status(200).json({message: `El retiro con el id ${req.body._id} ha sido actualizado exitosamente`, data})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.put('/admin', Auth.isUsuario ,Auth.permisos(['Asignación de Permisos'],'Modificar'), async (req, res) => {
    try {
      // console.log(req.body)
      const data = await Usuario.update(req.body)
      res.status(200).json({message: `El retiro con el id ${req.body._id} ha sido actualizado exitosamente`, data})
    } catch (error) {
      handleError(error, res)
    }
  })


  // app.put('/', Auth.isUsuario,upload.single('imagen'), async (req, res) => {
  //   // const { _id, nombre, apellido, identificacion, direccion,telefono,email,password,instagram,facebook,twitter,provincia,sector } = req.body
  //   // let imagen = ''
  //   // if (req.file && req.file.path) {
  //   //   imagen = `/images/usuario/${req.file.filename}`
  //   // }
  //   // const q = { _id, nombre, apellido, identificacion, direccion ,imagen,telefono,email,password,instagram,facebook,twitter,provincia,sector }
  
  //   console.log(req.body)
  //   try {
  //     const data = await Usuario.update(req.body)
  //     res.status(200).json({message: `El usuario con el id ${req.body._id} ha sido actualizado exitosamente`, data})
  //   } catch (error) {
  //     handleError(error, res)
  //   }
  // })
  
  app.delete('/:id',Auth.isUsuario, Auth.permisos(['Asignación de Permisos'],'Eliminar'),async (req, res) => {
    try {
      const data = await Usuario.delete(req.params.id)
      const data2 = await Cliente.deleteweb(req.params.id)
      res.status(200).json({message: `El usuario con el id ${req.params.id} ha sido eliminado`,data})
    } catch (error) {
      handleError(error, res)
    }
  })
  
  export default app