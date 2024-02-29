'use strict'

import express from 'express'
import multer from 'multer'
import { Auth} from '../middleware'
import { Cliente, Email } from '../api'
import { Login } from '../services'
import { handleError } from '../Utils'
import io from 'socket.io-client';
import {server} from '../Utils'
import { db } from '../config'
const axios = require('axios');
const https = require('https');
const moment = require('moment');
const socket = io(server);
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/images/cliente/')
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
  
  const upload = multer({storage: storage, limits:{fileSize:25 * 1024 * 1024}})
  const app = express.Router()
  
  app.get('/', Auth.isCliente,async (req, res) => {
    try {
      const data = await Cliente.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun cliente'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin', Auth.isCliente, Auth.permisos(['Clientes'],'Ver'), async (req, res) => {
    try {
      const data = await Cliente.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun cliente'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  
  app.get('/admin/dashboard', Auth.isCliente, Auth.permisos(['Dashboard'],'Ver'), async (req, res) => {
    try {
      const data = await Cliente.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun cliente'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  
  app.get('/admin/reserva', Auth.isCliente, Auth.permisos(['Reporte de Reservas'],'Ver'), async (req, res) => {
    try {
      const data = await Cliente.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun cliente'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  
  app.get('/admin/seguimiento', Auth.isCliente, Auth.permisos(['Seguimiento'],'Ver'), async (req, res) => {
    try {
      const data = await Cliente.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun cliente'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin/notificaciones', Auth.isCliente, Auth.permisos(['Notificaciones'],'Ver'), async (req, res) => {
    try {
      const data = await Cliente.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun cliente'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })
  
  app.get('/password/:email',  async (req, res) => {
    try {
      let value = Math.floor(Math.random()*(Math.floor(999999)-Math.ceil(100000)))+Math.ceil(100000)
      const data = await Cliente.returnUpdateByEmail({
        email:req.params.email,
        codigo_pass:value,
        fecha_codigo:new Date(new Date().setHours(new Date().getHours() + 1))
      })
      if(!data){
        res.status(404).json({starus:'denied',message:'Usuario no existe'})  
      }else{
        Email.enviaremail(
          data.email,
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

  app.get('/validar', Auth.isCliente,async (req, res) => {
    try {
      res.status(200).json({status:'Success', message:'Validacion correcta'})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/:id', Auth.isCliente, async (req, res) => {
    try {
      const data = await Cliente.findById(req.params.id)
      if(!data)
        res.status(404).json({message:`No existe el cliente con el id ${req.params.id}`})
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/', upload.single('imagen'), async (req, res) => {
    /*const { _id, nombre, apellido, identificacion, direccion, telefono,email,password,instagram,facebook,twitter,provincia,sector } = req.body
    let imagen = ''
    if (req.file && req.file.path) {
      imagen = `/images/cliente/${req.file.filename}`
    }
    const q = { _id, nombre, apellido, identificacion, direccion ,imagen,telefono,email,password,instagram,facebook,twitter,provincia,sector }
  */
  
    try {
      let q = req.body
      q.saldo=0
      if(!q.estatus) {
        q.estatus='Activo'
      }
      const data = await Cliente.create(q)
      if(data.message){
        res.status(201).json(data)
      }else{
        Email.enviaremail(req.body.email,'Registro de Cliente','registros',{
          nombre:req.body.nombre,
          apellido:req.body.apellido,
          telefono:req.body.telefono,
          email:req.body.email,
        })
        socket.emit('actualizar_cli',{message:'Actualizacion de cli'})
        res.status(201).json(data)
      }
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/login', async (req, res) => {
    try {
      const cliente = await Cliente.loginCliente(req.body)
      if(cliente == 'user') {
        res.status(200).json({ status: 'denied', message: 'Usuario no existe'})
      }
      else if(cliente == 'pass'){
        res.status(200).json({ status: 'denied', message: 'Contraseña invalida'})
      }
      else{
        const token = await Cliente.token(cliente)
        res.status(201).json(token)
      }
    } catch (error) {
      handleError(error, res)
    }
})

app.post('/validar', async (req, res) => {
  let q = req.body
  try {
    const data = await Cliente.findById(q._id)
    // console.log(data)
    if(data.fecha_codigo&&moment().isBefore(moment(data.fecha_codigo))&&q.codigo===data.codigo_pass){
      res.status(200).json({status:'succes',message:'Codigo valido'})
    }else{
      res.status(200).json({status:'denied',message:'Codigo invalido'})
    }
  } catch (error) {
    handleError(error, res)
  }
})

  app.put('/', Auth.isCliente, upload.single('image'),async (req, res) => {
    let id= await Login.decodeTok(req.headers.authorization.split(' ')[1])
    let image
    if(id.rol=='Cliente'){
      req.body._id=id.sub
    }
    let q = req.body
    if(req.file){
      image={url:`/images/cliente/${req.file.filename}`}
      q.imagen = image
    }
    try {
      console.log('se ejecuta esto')
      if(q.tarjeta){
        let user = await Cliente.findById(q._id)
        const httpsAgent = new https.Agent({
          rejectUnauthorized: false,
          cert: fs.readFileSync(path.resolve(__dirname,'../public/cert-apolo-prod.crt')),
          key: fs.readFileSync(path.resolve(__dirname,'../public/apolo-produccion.key'))
        });
        const payload = {
          Channel: 'EC',
          Store: '39272770033',
          CardNumber: q.tarjeta.numero.replace(/\s/g,''),
          Expiration: q.tarjeta.expiracion,
          CVC: q.tarjeta.cvc,
          TrxType: 'CREATE'
        };

        try {
          const { data } = await axios.post(
            // `https://pruebas.azul.com.do/webservices/JSON/Default.aspx?ProcessDatavault`,
            `https://pagos.azul.com.do/webservices/JSON/Default.aspx?ProcessDatavault`,
            payload,
            {
              httpsAgent,
              headers: {
              'Content-Type': 'application/json',
              Auth1: 'ApoloTaxiApp',
              Auth2: 'aqTaf5gNvVVv'
            }}
          );
          console.log(data)
          if(data.ResponseMessage==='APROBADA'){
            q.tarjeta.token=data.DataVaultToken
          }else throw new Error('Tarjeta rechazada')
        } catch (error) {
          console.log(error)
          throw error
        }
        if(q.guardar){
          if(user.tarjetas){
            user.tarjetas.map(el=>{
              if(el.default) {
                el.default=false
              }
            })
            q.tarjetas=user.tarjetas
            console.log(q.tarjeta)
            q.tarjetas.push({
              numero:q.tarjeta.numero.replace(/\s/g,'').substring(12),
              tipo:q.tarjeta.tipo==='visa'?'Visa':q.tarjeta.tipo==='master-card'?'Master Card':'American Express',
              token:q.tarjeta.token?q.tarjeta.token:'',
              cvc:q.tarjeta.cvc,
              default:q.tarjeta.default?q.tarjeta.default:false
            })
          }else{
            q.tarjetas=[{
              numero:q.tarjeta.numero.replace(/\s/g,'').substring(12),
              tipo:q.tarjeta.tipo==='visa'?'Visa':q.tarjeta.tipo==='master-card'?'Master Card':'American Express',
              token:q.tarjeta.token?q.tarjeta.token:'',
              cvc:q.tarjeta.cvc,
              default:q.tarjeta.default?q.tarjeta.default:false
            }]
          }
        }else{
          // console.log(q.tarjeta.token)
          q.tarjeta_tmp={
            numero:q.tarjeta.numero.replace(/\s/g,''),
            tipo:q.tarjeta.tipo==='visa'?'Visa':q.tarjeta.tipo==='master-card'?'Master Card':'American Express',
            token:q.tarjeta.token?q.tarjeta.token:'',
            exp:q.tarjeta.expiracion,
            cvc:q.tarjeta.cvc,
            default:q.tarjeta.default?q.tarjeta.default:false
          }
        }
      }
      const data = await Cliente.update(q)
      res.status(200).json({message: `El cliente con el id ${req.body._id} ha sido actualizado exitosamente`, data})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.put('/tarjeta', Auth.isCliente, upload.single('image'),async (req, res) => {
    let id= await Login.decodeTok(req.headers.authorization.split(' ')[1])
    if(id.rol=='Cliente'){
      req.body._id=id.sub
    }
    let q = req.body
    console.log(q.tarjeta)
    try {
      let user = await Cliente.findById(q._id)
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
        cert: fs.readFileSync(path.resolve(__dirname,'../public/cert-apolo-prod.crt')),
        key: fs.readFileSync(path.resolve(__dirname,'../public/apolo-produccion.key'))
      });
      const payload = {
        Channel: 'EC',
        Store: '39272770033',
        CardNumber: "",
        Expiration: "",
        CVC: "",
        TrxType: 'DELETE',
        DataVaultToken:q.tarjeta.token
      };

      try {
        const { data } = await axios.post(
          // `https://pruebas.azul.com.do/webservices/JSON/Default.aspx?ProcessDatavault`,
          `https://pagos.azul.com.do/webservices/JSON/Default.aspx?ProcessDatavault`,
          payload,
          { httpsAgent,
            headers: {
            'Content-Type': 'application/json',
            Auth1: 'ApoloTaxiApp',
            Auth2: 'aqTaf5gNvVVv'
          }}
        );
        console.log(data)
        if(data.ResponseMessage==='APROBADA'){
          q.tarjeta.token=data.DataVaultToken
        }else throw new Error('Ha ocurrido un error')
      } catch (error) {
        throw error
      }
      q.tarjetas = user.tarjetas.filter(el=>{
        return  el.numero !== q.tarjeta.numero
      })
      const data = await Cliente.update(q)
      res.status(200).json({message: `Tarjeta eliminada exitosamente`, data})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.put('/password',async (req, res) => {
    let q = req.body
    try {
      q.updatedAt=moment()
      const data = await Cliente.update(q)
      res.status(200).json({message: `El chofer con el id ${req.body._id} ha sido actualizado exitosamente`, status:'success'})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.put('/admin', Auth.isAuth, Auth.permisos(['Clientes'],'Modificar'), async (req, res) => {
    let id= await Login.decodeTok(req.headers.authorization.split(' ')[1])
    if(id.rol=='Cliente'){
      req.body._id=id.sub
    }
    try {
      const data = await Cliente.update(req.body)
      res.status(200).json({message: `El cliente con el id ${req.body._id} ha sido actualizado exitosamente`, data})
    } catch (error) {
      handleError(error, res)
    }
  })
  
  app.delete('/:id', Auth.isCliente, async (req, res) => {
    try {
      const data = await Cliente.delete(req.params.id)
      res.status(200).json({message: `El cliente con el id ${req.params.id} ha sido eliminado`,data})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.delete('/admin/:id', Auth.isAuth, Auth.permisos(['Clientes'],'Eliminar'),  async (req, res) => {
    try {
      const data = await Cliente.delete(req.params.id)
      await db.ref('cliente/'+req.params.id+'/token').remove()
      res.status(200).json({message: `El cliente con el id ${req.params.id} ha sido eliminado`,data})
    } catch (error) {
      handleError(error, res)
    }
  })
  
  export default app