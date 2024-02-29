'use strict'

import express from 'express'
import multer from 'multer'
import { Extra, Notificaciones, Email, Prueba} from '../api'
import { handleError } from '../Utils'
import { Auth } from '../middleware'
import { Login, Busqueda, StaticMap } from '../services'
const path = require('path');
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
  app.post('/email', async (req, res) => {
    try {
      console.log(__dirname)
      res.sendFile(path.join(__dirname, '../emails', 'finalizado.html'));
      Email.enviaremail('lusman1995@gmail.com', 'Compra finalizada', 'finalizado', {})
      // Email.enviaremail('liordimendez@gmail.com', 'Compra finalizada', 'finalizado', {})
    } catch (error) {
      handleError(error, res)
    }
  })
  app.get('/staticmap', async (req, res) => {
    try {
      StaticMap.create()
      res.status(200).json('se creo')
    } catch (error) {
      handleError(error, res)
    }
  })
  app.get('/geocode', Auth.isAuth, async (req, res) => {
    try {
      const data = await Busqueda.geocode({lat: '18.487713', lng: '-69.912277'})
      res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })
  app.post('/notificaciones', async (req, res) => {
    try {
      const data = await Notificaciones.enviar(req.body.token, req.body.titulo, req.body.cuerpo, {prueba: 'data de prueba'}, 'tipo')
      res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/azul', async(req,res)=>{
    try {

      const data = await Prueba.processPayment(req, res) 
      res.status(200).json(data)
    } catch (error) {
      handleError(error,res)
    }
  })

  app.get('/:id', Auth.isAuth, async (req, res) => {
    try {
      const data = await Extra.findById(req.params.id)
      if(!data)
        res.status(404).json({message:`No existe el extra con el id ${req.params.id}`})
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/', Auth.isUsuario, upload.single('imagen'), async (req, res) => {
    console.log(req.body)
    try {
      const data = await Extra.create(req.body)
      //const chofer = await Chofer.update({_id:req.body.owner}, {$set:{vehiculos:req.body}})
      res.status(201).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.put('/', Auth.isUsuario , async (req, res) => {
    try {
      const data = await Extra.update(req.body)
      res.status(200).json({message: `El extra con el id ${req.body._id} ha sido actualizado exitosamente`, data})
    } catch (error) {
      handleError(error, res)
    }
  })
  
  app.delete('/:id', Auth.isUsuario, async (req, res) => {
    try {
      const data = await Extra.delete(req.params.id)
      res.status(200).json({message: `El extra con el id ${req.params.id} ha sido eliminado`,data})
    } catch (error) {
      handleError(error, res)
    }
  })
  
  export default app