'use strict'

import express from 'express'
import multer from 'multer'
import {Chofer} from '../models'
import { Vehiculo} from '../api'
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
  
  const upload = multer({storage: storage, limits:{fileSize:25 * 1024 * 1024}})
  const app = express.Router()
  
  app.get('/', Auth.isChofer ,async (req, res) => {
    try {
      const data = await Vehiculo.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun vehiculo'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })
  
  app.get('/owner/:d', Auth.isChofer, async (req, res) => {
    // console.log(req.params.d)
    try {
      const data = await Vehiculo.findByOwner(req.params.d)
      if(!data)
        res.status(404).json({message:`No existen vehiculos`})
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/estatus', Auth.isChofer, async (req, res) => {
    try {
      const data = await Vehiculo.findById(req.body._id)
      // console.log(data)
      if(!data)
        res.status(404).json({message:`No existe el vehiculo con el id ${id.sub}`})
      else
        res.status(200).json({estatus:data.estatus})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/:id', Auth.isChofer, async (req, res) => {
    try {
      const data = await Vehiculo.findById(req.params.id)
      if(!data)
        res.status(404).json({message:`No existe el vehiculo con el id ${req.params.id}`})
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/activar', Auth.isChofer, upload.single('imagen'), async (req, res) => {
    let id = await Login.decodeTok(req.headers.authorization.split(' ')[1])
    try {
      let q = req.body
      q.estatus= 'Activo'
      const data = await Vehiculo.update(q)
      await Chofer.updateOne({_id:id.sub}, {$set:{vehiculo:req.body._id}})
      res.status(201).json({status:'Success', message:'Vehiculo activado',data})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/', Auth.isChofer, upload.single('imagen'), async (req, res) => {
    let id = await Login.decodeTok(req.headers.authorization.split(' ')[1])
    try {
      let q = req.body
      q.estatus='Activo'
      const data = await Vehiculo.create(req.body)
      await Chofer.updateOne({_id:id.sub}, {$set:{vehiculo:data._id,estatus:'Pendiente'}})
      res.status(201).json({status:'Success', message:'Vehiculo creado',data})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/admin', Auth.permisos(['Adm. de Choferes'],'Crear'), upload.any(), async (req, res) => {
    try {
      let image  =[]
      let q = req.body
      if(req.files){
        for (let i = 0; i < req.files.length; i++) {
          if (req.files[i] && req.files[i].path) {
            image.push({url : `/images/vehiculo/${req.files[i].filename}`, status:'Pendiente'})
          }
        }
        q.images = image
      }
      q.estatus='Activo'
      const data = await Vehiculo.create(q)
      await Chofer.updateOne({_id: q.owner}, {$set:{vehiculo:data._id,estatus:'Pendiente'}})
      res.status(201).json({status:'Success', message:'Vehiculo creado',data})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.put('/admin', Auth.permisos(['Adm. de Choferes'],'Modificar'), upload.any(), async (req, res) => {
    try {
      let image  =[]
      let q = req.body
      if(req.files){
        if(req.files.length > 0) {
          for (let i = 0; i < req.files.length; i++) {
            if (req.files[i] && req.files[i].path) {
              image.push({url : `/images/vehiculo/${req.files[i].filename}`, status:'Pendiente'})
            }
          }
          q.images = image
        } else {
          let g = []
          for (let i = 0; i < q.images.length; i++) {
            g.push({url: q.images[i], status: "Pendiente"})
          }
          q.images = g
        }
      }
      q.estatus='Activo'
      await Chofer.updateOne({_id:q.owner},{$set:{estatus:'Pendiente'}})
      const data = await Vehiculo.update(q)
      res.status(201).json({status:'Success', message:'Vehiculo creado',data})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.put('/', Auth.isChofer, upload.any(), async (req, res) => {
    let id = await Login.decodeTok(req.headers.authorization.split(' ')[1])
    let image  =[]
    let q = req.body
    if(req.files){
      for (let i = 0; i < req.files.length; i++) {
        if (req.files[i] && req.files[i].path) {
          image.push({url : `/images/vehiculo/${req.files[i].filename}`, status:'Pendiente'})
        }
      }
      q.images = image
    }
    if(id.rol==='Chofer'){
      req.body.owner=id.sub
    }
    else{
      let veh = await Vehiculo.findById(req.body._id)
      req.body.owner= veh.owner
    }
    try {
      await Chofer.updateOne({_id:req.body.owner},{$set:{estatus:'Pendiente'}})
      const data = await Vehiculo.update(q)
      res.status(200).json({message: `El vehiculo con el id ${req.body._id} ha sido actualizado exitosamente`, data})
    } catch (error) {
      handleError(error, res)
    }
  })
  
  app.delete('/:id', Auth.isChofer, async (req, res) => {
    try {
      const data = await Vehiculo.delete(req.params.id)
      res.status(200).json({message: `El vehiculo con el id ${_id} ha sido eliminado`,data})
    } catch (error) {
      handleError(error, res)
    }
  })
  
  export default app