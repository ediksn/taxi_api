'use strict'

import express from 'express'
import multer from 'multer'
import { Dev, Secuencia, Chofer, Notificaciones} from '../api'
import { handleError } from '../Utils'
import { Auth } from '../middleware'
import { Login } from '../services'
import io from 'socket.io-client';
import {server} from '../Utils'
const socket = io(server);
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/images/vehiculo/')
    },
    filename: function (req, file, cb) {
      // console.log(file);
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
  
  app.get('/', Auth.isAuth, async (req, res) => {
    try {
      const data = await Dev.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun retiro'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/:id', Auth.isAuth, async (req, res) => {
    try {
      const data = await Dev.findById(req.params.id)
      if(!data)
        res.status(404).json({message:`No existe el retiro con el id ${req.params.id}`})
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })


  app.post('/', async (req, res) => {
    let q = req.body
    try {
      const data = await Dev.create(q)
      res.status(201).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.put('/',  async (req, res) => {
    try {
      socket.emit('devol', req.body)
      const data = await Dev.update(req.body)
      Notificaciones.enviar(
        data.cliente.fcmtoken,
        'Aviso de Devolución',`Su devolución ha sido ${req.body.estatus}`,
        req.body.nota,'dev'
      )
      await Notificaciones.create({
        titulo: 'Aviso de Devolución',
        cuerpo: req.body.nota,
        clientes:[{
          clientes: data.cliente._id,
          entregado: 'Si'
        }]
      })
      if(req.body.estatus === 'Aceptado'){
        Notificaciones.enviar(
          data.cliente.fcmtoken,
          'Aviso de Devolución','Cargo por devolución de viaje realizado',
          'Se ha realizado un cargo por concepto de devolución a solicitud de un cliente. Para mas información ponganse en contacto con soporte','dev'
        )
        await Notificaciones.create({
          titulo: 'Aviso de Devolución',
          cuerpo: 'Se ha realizado un cargo por concepto de devolución a solicitud de un cliente. Para mas información ponganse en contacto con soporte',
          choferes:[{
            choferes: data.chofer._id,
            entregado: 'Si'
          }]
        })
      }
      res.status(200).json({message: `La devolucion ${req.body._id} ha sido actualizado ${req.body.estatus}`})
    } catch (error) {
      console.log(error)
      handleError(error, res)
    }
  })
  
  app.delete('/:id', Auth.isUsuario, async (req, res) => {
    try {
      const data = await Dev.delete(req.params.id)
      res.status(200).json({message: `El retiro con el id ${req.params.id} ha sido eliminado`,data})
    } catch (error) {
      handleError(error, res)
    }
  })
  
  export default app