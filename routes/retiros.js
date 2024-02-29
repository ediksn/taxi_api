'use strict'

import express from 'express'
import multer from 'multer'
import { Retiros, Secuencia, Chofer} from '../api'
import { handleError } from '../Utils'
import { Auth } from '../middleware'
import { Login } from '../services'
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
  
  app.get('/',async (req, res) => {
    try {
      const data = await Retiros.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun retiro'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin', Auth.permisos(['Adm. de Retiros'],'Ver'), async (req, res) => {
    try {
      const data = await Retiros.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun retiro'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin/balance', Auth.permisos(['Balance'],'Ver'), async (req, res) => {
    try {
      const data = await Retiros.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun retiro'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin/rpagos', Auth.permisos(['Reporte de Pagos'],'Ver'), async (req, res) => {
    try {
      const data = await Retiros.find()
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
      const data = await Retiros.findById(req.params.id)
      if(!data)
        res.status(404).json({message:`No existe el retiro con el id ${req.params.id}`})
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/chofer/:id', Auth.isChofer, async (req, res)=>{
    try {
      const data = await Retiros.findByChofer(req.params.id)
      if(!data)
        res.status(404).json({message:`No existe retiros del chofer ${req.params.id}`})
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/fechas/:x/:y', Auth.isUsuario, async (req, res) => {
    try {
      const data = await Retiros.findFechas(req.params.x,req.params.y)
      if(data.length==0){
        res.status(404).json({message:'No existe ninguna retiro'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/', upload.single('imagen'), async (req, res) => {
    try {
      const seq2 = await Secuencia.findSec()
      const sec = seq2[0].secuencia + 1
      const seq = await Secuencia.create({secuencia: sec})
      let q = req.body
      q.id = seq.secuencia
      const data = await Retiros.create(q)
      res.status(201).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.put('/', Auth.isUsuario , async (req, res) => {
    try {
      const data = await Retiros.update(req.body)
      res.status(200).json({message: `El retiro con el id ${req.body._id} ha sido actualizado exitosamente`, data})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.put('/admin', Auth.isUsuario , Auth.permisos(['Adm. de Retiros'],'Modificar'), async (req, res) => {
    try {
      let chof = req.body.chofer
      let monto = JSON.parse(req.body.monto)
      if(req.body.estatus==='Aceptado'){
        chof.bloqueado -= monto 
      }else {
        chof.saldo += monto
        chof.bloqueado -= monto
      } 
      await Chofer.update(chof)
      const data = await Retiros.update(req.body)
      res.status(200).json({message: `El retiro con el id ${req.body._id} ha sido actualizado exitosamente`, data})
    } catch (error) {
      handleError(error, res)
    }
  })
  
  app.delete('/:id', Auth.isUsuario, async (req, res) => {
    try {
      const data = await Retiros.delete(req.params.id)
      res.status(200).json({message: `El retiro con el id ${req.params.id} ha sido eliminado`,data})
    } catch (error) {
      handleError(error, res)
    }
  })
  
  export default app