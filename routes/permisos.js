'use strict'

import express from 'express'
import multer from 'multer'
import { Permisos } from '../api'
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
      console.log('Permisos')
      const data = await Permisos.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun Permiso'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin', Auth.isAuth,Auth.permisos(['Asignación de Permisos'],'Ver'), async (req, res) => {
    try {
      console.log('Permisos')
      const data = await Permisos.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun Permiso'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/:id', Auth.isAuth, async (req, res) => {
    try {
      const data = await Permisos.findById(req.params.id)
      if(!data)
        res.status(404).json({message:`No existe el permiso con el id ${req.params.id}`})
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/', Auth.isUsuario, upload.single('imagen'), Auth.permisos(['Asignación de Permisos'],'Crear'),async (req, res) => {
    // console.log(req.body)
    try {
      const data = await Permisos.create(req.body)
      //const chofer = await Chofer.update({_id:req.body.owner}, {$set:{vehiculos:req.body}})
      res.status(201).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.put('/', Auth.isUsuario , Auth.permisos(['Asignación de Permisos'],'Modificar'), async (req, res) => {
    try {
      const data = await Permisos.update(req.body)
      res.status(200).json({message: `El permiso con el id ${req.body._id} ha sido actualizado exitosamente`, data})
    } catch (error) {
      handleError(error, res)
    }
  })
  
  app.delete('/:id', Auth.isUsuario, Auth.permisos(['Asignación de Permisos'],'Eliminar'), async (req, res) => {
    try {
      const data = await Permisos.delete(req.params.id)
      res.status(200).json({message: `El permiso con el id ${req.params.id} ha sido eliminado`,data})
    } catch (error) {
      handleError(error, res)
    }
  })
  
  export default app