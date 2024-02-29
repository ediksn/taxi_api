'use strict'

import express from 'express'
import multer from 'multer'
import {Settings} from '../models'
import { Geocerca, Ruta } from '../api'
import { handleError } from '../Utils'
import {Busqueda} from '../services/'
import { Auth } from '../middleware'
import { Login } from '../services'
import moment from 'moment'
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
  
  app.get('/', Auth.isAuth,async (req, res) => {
    try {
      const data = await Geocerca.find().populate('choferes')
      if(data.length==0){
        res.status(404).json({message:'No existe ningun extra'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin', Auth.isAuth,Auth.permisos(['Geocerca'],'Ver'), async (req, res) => {
    try {
      const data = await Geocerca.find().populate('choferes')
      res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin/dashboard', Auth.isAuth,Auth.permisos(['Dashboard'],'Ver'), async (req, res) => {
    try {
      const data = await Geocerca.find().populate('choferes')
      res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin/ruta', Auth.isAuth,Auth.permisos(['Rutas entre Geocercas'],'Ver'), async (req, res) => {
    try {
      const data = await Geocerca.find().populate('choferes')
      if(data.length==0){
        res.status(404).json({message:'No existe ningun extra'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin/seguimiento', Auth.isAuth,Auth.permisos(['Seguimiento'],'Ver'), async (req, res) => {
    try {
      const data = await Geocerca.find().populate('choferes')
      if(data.length==0){
        res.status(404).json({message:'No existe ningun extra'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/:id', Auth.isAuth, async (req, res) => {
    try {
      const data = await Geocerca.findById(req.params.id).populate('choferes')
      if(!data)
        res.status(404).json({message:`No existe el extra con el id ${req.params.id}`})
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/ubicar', async(req,res)=>{
    try {
      //let data = await Busqueda.buscarRuta(req.body.salida, req.body.llegada)
      let data = await Busqueda.ubicar(req.body.pos)
      // let mas = await Settings.findOne()
      // let tiempo = new Date
      // tiempo = moment(tiempo).add(mas.tiempo_esp, 's')
      res.status(200).json({status:'Succes', data})
    } catch (error) {
      handleError(error,res)
    }
  })

  app.post('/', Auth.isAuth, upload.single('imagen'), Auth.permisos(['Geocerca'],'Crear'),async (req, res) => {
    // console.log(req.body)
    try {
      const data = await Geocerca.create(req.body)
      res.status(201).json(data)
      socket.emit('actualizar_geo',{message:'Actualizacion de geocerca'})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.put('/', Auth.isAuth , Auth.permisos(['Geocerca'],'Modificar'), async (req, res) => {
      // console.log(req.body)
    try {
      const data = await Geocerca.update(req.body)
      res.status(200).json({message: `El Geocerca con el id ${req.body._id} ha sido actualizado exitosamente`, data})
    } catch (error) {
      handleError(error, res)
    }
  })
  
  app.delete('/:id', Auth.isAuth, Auth.permisos(['Geocerca'],'Eliminar'), async (req, res) => {
    try {
      let id = req.params.id
      const rut = await Ruta.findall(id)
      for (let i = 0; i < rut.length; i++) {
        const dato = await Ruta.delete(rut[i]._id)
      }
      const data = await Geocerca.delete(req.params.id)
      res.status(200).json({message: `El extra con el id ${req.params.id} ha sido eliminado`,data})
    } catch (error) {
      handleError(error, res)
    }
  })
  
  export default app