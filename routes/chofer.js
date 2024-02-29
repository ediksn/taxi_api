'use strict'

import express from 'express'
import multer from 'multer'
import { Chofer, Vehiculo, Geocerca, Notificaciones, Email } from '../api'
import { handleError } from '../Utils'
import { Auth } from '../middleware'
import { Login } from '../services'
import io from 'socket.io-client';
import {server} from '../Utils'
import { db } from '../config';
const moment = require('moment');
const socket = io(server);
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/images/chofer/')
    },
    filename: function (req, file, cb) {
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
      const data = await Chofer.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun chofer'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin', Auth.isAuth, Auth.permisos(['Lista de Choferes'],'Ver'), async (req, res) => {
    try {
      const data = await Chofer.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun chofer'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin/adm', Auth.isAuth, Auth.permisos(['Adm. de Choferes'],'Ver'), async (req, res) => {
    try {
      const data = await Chofer.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun chofer'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin/dashboard', Auth.isAuth, Auth.permisos(['Dashboard'],'Ver'), async (req, res) => {
    try {
      const data = await Chofer.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun chofer'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin/reserva', Auth.isAuth, Auth.permisos(['Reporte de Reservas'],'Ver'), async (req, res) => {
    try {
      const data = await Chofer.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun chofer'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin/seguimiento', Auth.isAuth, Auth.permisos(['Seguimiento'],'Ver'), async (req, res) => {
    try {
      const data = await Chofer.findSeguimiento()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun chofer'})
      }
      else
        // data = data.filter(el=>{
        //   return el.updatedAt >= new Date(new Date().setMinutes()-5)
        // })
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin/geocerca', Auth.isAuth, Auth.permisos(['Geocerca'],'Ver'), async (req, res) => {
    try {
      const data = await Chofer.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun chofer'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin/notificaciones', Auth.isAuth, Auth.permisos(['Notificaciones'],'Ver'), async (req, res) => {
    try {
      const data = await Chofer.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun chofer'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/fechas/:x/:y', Auth.isAuth, Auth.permisos(['Lista de Choferes', 'Adm. de Choferes'],'Ver') , async (req, res) => {
    try {
      const data = await Chofer.findFechas(req.params.x,req.params.y)
      if(data.length==0){
        res.status(404).json({message:'No existe ningun chofer'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })
  
  app.get('/estatus', Auth.isChofer, async (req, res) => {
    let id= await Login.decodeTok(req.headers.authorization.split(' ')[1])
    try {
      const data = await Chofer.findById(id.sub)
      //console.log(data)
      if(!data)
        res.status(404).json({message:`No existe el chofer con el id ${id.sub}`})
      else
        res.status(200).json({estatus:data.estatus})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/validar', Auth.isChofer,async (req, res) => {
    try {
      res.status(200).json({status:'Success', message:'Validacion correcta'})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/password/:email',  async (req, res) => {
    try {
      let value = Math.floor(Math.random()*(Math.floor(999999)-Math.ceil(100000)))+Math.ceil(100000)
      const data = await Chofer.returnUpdateByEmail({
        email:req.params.email,
        codigo_pass:value,
        fecha_codigo:new Date(new Date().setHours(new Date().getHours() + 1))
      })
      if(!data){
        res.status(404).json({status:'denied',message:'Usuario no existe'})  
      }else{
        Email.enviaremail(
          req.params.email,
          'Recuperación de contraseña',
          'password',
          {
            codigo:value,
            nombre:data.nombre
          }
        )
        res.status(404).json({status:'success',message:`Correo enviado`,_id:data._id})
      }
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/:id', Auth.isAuth, async (req, res) => {
    try {
      const data = await Chofer.findById(req.params.id)
      if(!data)
        res.status(404).json({message:`No existe el chofer con el id ${req.params.id}`})
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })
  app.post('/location', async (req, res) => {
    let id= await Login.decodeTok(req.headers.authorization.split(' ')[1])
    let image
    if(id.rol=='Chofer'){
      req.body._id=id.sub
    }
    let q = req.body
    if(req.file){
      image={url:`/images/chofer/${req.file.filename}`, status:'Pendiente'}
      q.imagen = image
      q.estatus='Pendiente'
    }
    try {
      const data = await Chofer.update(q)
      socket.emit('posicion_chofer', req.body)
      res.status(200).json({message: `El chofer con el id ${req.body._id} ha sido actualizado exitosamente`, data})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/validar', async (req, res) => {
    let q = req.body
    try {
      const data = await Chofer.findById(q._id)
      if(data.fecha_codigo&&moment().isBefore(moment(data.fecha_codigo))&&q.codigo===data.codigo_pass){
        res.status(200).json({status:'succes',message:'Codigo valido'})
      }else{
        res.status(200).json({status:'denied',message:'Codigo invalido'})
      }
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/admin', upload.any(), async (req, res) => {
    try {
      let data = req.body
      if(req.files){
        for(let i =0; i<req.files.length;i++){
          if(req.files[i].fieldname==='iden'){
            data.iden={url:`/images/chofer/${req.files[i].filename}`, status:'Pendiente'}
          }
          else if(req.files[i].fieldname==='licen'){
            data.licen={url:`/images/chofer/${req.files[i].filename}`,status:'Pendiente'}
          }
          else if(req.files[i].fieldname==='matricula'){
            data.matricula={url:`/images/chofer/${req.files[i].filename}`,status:'Pendiente'}
          }
          else if(req.files[i].fieldname==='seguro'){
            data.seguro={url : `/images/chofer/${req.files[i].filename}`, status:'Pendiente'}
          }
          else if(req.files[i].fieldname==='perfil'){
            data.imagen={url : `/images/chofer/${req.files[i].filename}`, status:'Pendiente'}
          }
        }
      }
      data.saldo = 0
      data.estatus= 'Pendiente'
      socket.emit('actualizar_chof',{message:'Actualizacion de chofer'})
      Email.enviaremail(req.body.email,'Registro de Chofer','registrochofer',{
        nombre:req.body.nombre,
        apellido:req.body.apellido,
        telefono:req.body.telefono,
        email:req.body.email,
      })
      const data2 = await Chofer.create(data)
      res.status(201).json(data2)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/', upload.single('imagen'), async (req, res) => {
    try {
      let data = req.body
      data.saldo = 0
      data.estatus= 'Pendiente'
      const data2 = await Chofer.create(data)
      if(data2.message){
        res.status(201).json(data2)
      }else{
        socket.emit('actualizar_chof',{message:'Actualizacion de chofer'})
        Email.enviaremail(req.body.email,'Registro de Chofer','registrochofer',{
          nombre:req.body.nombre,
          apellido:req.body.apellido,
          telefono:req.body.telefono,
          email:req.body.email,
        })
        res.status(201).json(data2)
      }
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/login', async (req, res) => {
    try {
      const chofer = await Chofer.loginChofer(req.body)
      if(chofer == 'user') {
        res.status(200).json({ status: 'denied', message: 'Usuario no existe'})
      }
      else if(chofer == 'pass'){
        res.status(200).json({ status: 'denied', message: 'Contraseña invalida'})
      }
      else{
        const token = await Chofer.token(chofer)
        res.status(201).json(token)
      }
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/cercanos',Auth.isCliente,async(req,res)=>{
    try{
      let choferes = await Chofer.findClose(req.body.coords,req.body.taxi)
      if(choferes.length<1){
        res.status(404).json({status:'Vacio'})
      }
      else{
        res.status(200).json({status:'Succes', data:choferes})
      }
    }
    catch(error){
      handleError(error, res)
    }
  })

  app.put('/admin/documents', Auth.isAuth, upload.any() ,async (req, res) => {
    let q = req.body
    if(req.files){
      for(let i =0; i<req.files.length;i++){
        if(req.files[i].fieldname==='iden'){
          q.iden={url:`/images/chofer/${req.files[i].filename}`, status:'Pendiente'}
        }
        else if(req.files[i].fieldname==='licen'){
          q.licen={url:`/images/chofer/${req.files[i].filename}`,status:'Pendiente'}
        }
        else if(req.files[i].fieldname==='matricula'){
          q.matricula={url:`/images/chofer/${req.files[i].filename}`,status:'Pendiente'}
        }
        else if(req.files[i].fieldname==='seguro'){
          q.seguro={url : `/images/chofer/${req.files[i].filename}`, status:'Pendiente'}
        }
        else if(req.files[i].fieldname==='perfil'){
          q.imagen={url : `/images/chofer/${req.files[i].filename}`, status:'Pendiente'}
        }
      }
    }
    q.updatedAt=moment()
    q.estatus='Pendiente'
    try {
      const data = await Chofer.update(q)
      socket.emit('put_chof',{message:'Actualizacion de chofer',chofer:data._id})
      res.status(200).json({message: `El chofer con el id ${req.body._id} ha sido actualizado exitosamente`, data})
    } catch (error) {
      handleError(error, res)
    }
  })


  app.put('/documents', Auth.isChofer, upload.any() ,async (req, res) => {
    //console.log('se ejecuta documents')
    let id= await Login.decodeTok(req.headers.authorization.split(' ')[1])
    let image
    if(id.rol=='Chofer'){
      req.body._id=id.sub
    }
    let q = req.body
    if(req.files){
      for(let i =0; i<req.files.length;i++){
        if(req.files[i].fieldname==='iden'){
          q.iden={url:`/images/chofer/${req.files[i].filename}`, status:'Pendiente'}
        }
        else if(req.files[i].fieldname==='licen'){
          q.licen={url:`/images/chofer/${req.files[i].filename}`,status:'Pendiente'}
        }
        else if(req.files[i].fieldname==='matricula'){
          q.matricula={url:`/images/chofer/${req.files[i].filename}`,status:'Pendiente'}
        }
        else{
          q.seguro={url : `/images/chofer/${req.files[i].filename}`, status:'Pendiente'}
        }
      }
    }
    q.updatedAt=moment()
    q.estatus='Pendiente'
    try {
      const data = await Chofer.update(q)
      socket.emit('put_chof',{message:'Actualizacion de chofer',chofer:data._id})
      res.status(200).json({message: `El chofer con el id ${req.body._id} ha sido actualizado exitosamente`, data})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.put('/password',async (req, res) => {
    let q = req.body
    try {
      q.updatedAt=moment()
      const data = await Chofer.update(q)
      res.status(200).json({message: `El chofer con el id ${req.body._id} ha sido actualizado exitosamente`, status:'success'})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.put('/', Auth.isChofer, upload.single('image') ,async (req, res) => {
    let id= await Login.decodeTok(req.headers.authorization.split(' ')[1])
    let image
    let q = req.body
    if(q.map){
      let chof = await Chofer.findById(id.sub)
      if(chof && typeof(chof.orientacion)!=='undefined'){
        let A ={lat : chof.map.lat, lng: chof.map.lng}
        let B ={lat : q.map.lat, lng: q.map.lng}
        let X = Math.cos(B.lat)*Math.sin(A.lng-B.lng)
        let Y = Math.cos(A.lat)*Math.sin(B.lat)-(Math.sin(A.lat)*Math.cos(B.lat)*Math.cos(A.lat-B.lat))
        let ori = Math.atan2(X,Y)
        ori = ori*(180/Math.PI)
        q.orientacion= ori === 0 ? chof.orientacion : ori   
      }
    }
    if(id.rol=='Chofer'){
      req.body._id=id.sub
    }
    if(req.file){
      image={url:`/images/chofer/${req.file.filename}`, status:'Pendiente'}
      q.imagen = image
      q.estatus='Pendiente'
      socket.emit('put_chof',{message:'Actualizacion de chofer',chofer:req.body._id})
    }else{
      socket.emit('actualizar_reserv',{message:'Actualizacion de chofer'})
    }
    if(q.cliente){
      socket.emit('ubicacion',{coordenadas:q.map, cliente:q.cliente._id, orientacion: q.orientacion})
    }
    try {
      q.updatedAt=moment()
      const data = await Chofer.update(q)
      res.status(200).json({message: `El chofer con el id ${req.body._id} ha sido actualizado exitosamente`, data})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.put('/admin', Auth.isChofer, Auth.permisos(['Lista de Choferes'],'Modificar') , async (req, res) => {
    let id= await Login.decodeTok(req.headers.authorization.split(' ')[1])
    if(id.rol=='Chofer'){
      req.body._id=id.sub
    }
    
    try {
      let q=req.body
      q.updatedAt=moment()
      const data = await Chofer.returnUpdate(q)
      socket.emit('actualizar_chof',{message:'Chofer actualizado', chofer:req.body.id})
      if(data.fcmtoken){
        Notificaciones.enviar(data.fcmtoken,'Datos actualizados','Sus datos han sido actualizados','Sus datos han sido actualizados','act')
      }
      res.status(200).json({message: `El chofer con el id ${req.body._id} ha sido actualizado exitosamente`, data})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.put('/prueba', async(req,res)=>{
    try {
      let data = await Chofer.returnUpdate(req.body)
      Notificaciones.enviar(data.fcmtoken,'Probando','Pruwba','Mensaje','act')
      res.status(200).json(data)
    } catch (error) {
      handleError(error,res)
    }
  })

  app.put('/admin/adm', Auth.isChofer, Auth.permisos(['Adm. de Choferes'],'Modificar') , async (req, res) => {
    let id= await Login.decodeTok(req.headers.authorization.split(' ')[1])
    if(id.rol=='Chofer'){
      req.body._id=id.sub
    }
    try {
      let q=req.body
      q.updatedAt=moment()
      const data = await Chofer.returnUpdate(q)
      socket.emit('actualizar_chof',{message:'Chofer actualizado', chofer:req.body._id})
      if(data.fcmtoken){
        Notificaciones.enviar(data.fcmtoken,'Datos actualizados','Sus datos han sido actualizados','Sus datos han sido actualizados','act')
      }
    } catch (error) {
      handleError(error, res)
    }
  })
  
  app.put('/admin/adm/status', Auth.isChofer, Auth.permisos(['Adm. de Choferes'],'Modificar') , async (req, res) => {
    let id= await Login.decodeTok(req.headers.authorization.split(' ')[1])
    try {
      let q=req.body
      q.chofer.updatedAt=moment()
      const data = await Chofer.returnUpdate(q.chofer)
      const veh = await Vehiculo.update(req.body.vehiculo)
      socket.emit('actualizar_chof',{message:'Chofer actualizado', chofer:req.body.chofer._id})
      if(req.body.chofer.estatus!=='Rechazado'){
        Email.enviaremail(data.email,'Solicitud Aprobada '+req.body.unidad,'aceptado',{nombre:req.body.chofer.nombre,unidad:req.body.unidad})
      }else{
        Email.enviaremail(data.email,'Solicitud Rechazada','rechazado',{nombre:req.body.chofer.nombre,razon:req.body.razon})
      }
      if(data.fcmtoken){
        Notificaciones.enviar(data.fcmtoken,'Datos actualizados','Sus datos han sido actualizados','Sus datos han sido actualizados','act')
      }
      res.status(200).json({message: `El chofer con el id ${req.body.chofer._id} ha sido actualizado exitosamente`, data})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.delete('/:id', Auth.isChofer, async (req, res) => {
    try {
      const data = await Chofer.delete(req.params.id)
      res.status(200).json({message: `El chofer con el id ${_id} ha sido eliminado`,data})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.delete('/admin/:id', Auth.isAuth, Auth.permisos(['Adm. de Choferes'],'Eliminar') , async (req, res) => {
    try {
      const data = await Chofer.delete(req.params.id)
      const data2 = await Vehiculo.DeleteOwner(req.params.id)
      const data3 = await Geocerca.searchChof(req.params.id)
      for (let i = 0; i < data3.length; i++) {
        for (let j = 0; j < data3[i].choferes.length; j++) {
          if (data3[i].choferes[j].toString() === req.params.id.toString()) {
            data3[i].choferes.splice(j,1)
            const info = data3[i]
            const data4 = await Geocerca.update(info)
          }
        }
      }
      db.ref('chofer/'+req.params.id+'/token').remove()
      res.status(200).json({message: `El chofer con el id ${req.params.id} ha sido eliminado`,data})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.delete('/admin/adm/:id', Auth.isAuth, Auth.permisos(['Adm. de Choferes'],'Eliminar') , async (req, res) => {
    try {
      const data = await Chofer.delete(req.params.id)
      const data2 = await Vehiculo.DeleteOwner(req.params.id)
      db.ref('chofer/'+req.params.id+'/token').remove()
      res.status(200).json({message: `El chofer con el id ${req.params.id} ha sido eliminado`,data})
    } catch (error) {
      handleError(error, res)
    }
  })
  
  export default app