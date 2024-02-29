'use strict'

import express from 'express'
import multer from 'multer'
import { Ruta } from '../api'
import { handleError } from '../Utils'
import { Auth } from '../middleware'
import { Login } from '../services'
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/images/vehiculo/')
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
  
  app.get('/', Auth.isAuth,async (req, res) => {
    try {
      const data = await Ruta.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ninguna Ruta'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin', Auth.isAuth,Auth.permisos(['Rutas entre Geocercas'],'Ver'), async (req, res) => {
    try {
      console.log('Ruta')
      const data = await Ruta.find().populate('llegada').populate('salida')
      if(data.length==0){
        res.status(404).json({message:'No existe ningun Ruta'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/:id', Auth.isAuth, async (req, res) => {
    try {
      const data = await Ruta.findById(req.params.id)
      if(!data)
        res.status(404).json({message:`No existe el Ruta con el id ${req.params.id}`})
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/', Auth.isUsuario, upload.single('imagen'), Auth.permisos(['Rutas entre Geocercas'],'Crear'),async (req, res) => {
    console.log(req.body)
    try {
      const data = await Ruta.create(req.body)
      res.status(201).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/multi', Auth.isUsuario, upload.single('imagen'), Auth.permisos(['Rutas entre Geocercas'],'Crear'),async (req, res) => {
    console.log(req.body)
    try {
      const info = []
      for (let i = 0; i < req.body.length; i++) {
        const data = await Ruta.create(req.body[i])
        info.push(data)
      }
      res.status(201).json(info)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.put('/', Auth.isUsuario , Auth.permisos(['Rutas entre Geocercas'],'Modificar'), async (req, res) => {
    try {
      const data = await Ruta.update(req.body)
      res.status(200).json({message: `El extra con el id ${req.body._id} ha sido actualizado exitosamente`, data})
    } catch (error) {
      handleError(error, res)
    }
  })
  
  app.delete('/:id', Auth.isUsuario, Auth.permisos(['Rutas entre Geocercas'],'Eliminar'), async (req, res) => {
    try {
      const data = await Ruta.delete(req.params.id)
      res.status(200).json({message: `El extra con el id ${req.params.id} ha sido eliminado`,data})
    } catch (error) {
      handleError(error, res)
    }
  })
  
  export default app