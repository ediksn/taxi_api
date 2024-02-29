'use strict'

import express from 'express'
import multer from 'multer'
import { Auth } from '../middleware'
import { Consulta } from '../api'
import { handleError } from '../Utils'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/images/consulta/')
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
  
  app.get('/', /*Auth.isUsuario,*/ async (req, res) => {
    try {
      const data = await Consulta.find()
      if(!data || data.length<1){
        res.status(404).json({message:'No existe ninguna Consulta'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin', /*Auth.isUsuario,Auth.permisos(['Configuraciones Basicas'],'Ver'),*/ async (req, res) => {
    try {
      const data = await Consulta.find()
      if(!data || data.length<1){
        res.status(404).json({message:'No existe ninguna Consulta'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })
  
  app.post('/', /*Auth.isUsuario, upload.single('imagen'),Auth.permisos(['Configuraciones Basicas'],'Crear'),*/ async (req, res) => {
    //console.log(req.body)
    try {
      const data = await Consulta.create(req.body)
      res.status(201).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  
  
  app.put('/', /*Auth.isUsuario,*/ async (req, res) => {
    console.log(req.body)
    try {
      const data = await Consulta.update(req.body)
      res.status(200).json({message: `Consultas actualizadas`, data})
    } catch (error) {
      handleError(error, res)
    }
  })
  
  
  export default app