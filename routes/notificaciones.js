'use strict'

import express from 'express'
import { Notificaciones } from '../api'
import { handleError } from '../Utils'
import { Auth } from '../middleware'
var FCM = require('fcm-node');
var serverKey = 'AAAAHw3ngvg:APA91bHeCKCrTZ9W1_Pf1CuP4wIhfr8kUo7HiunGryNSKy8TnGAuJQhYJ4-iH272ee89CGsk9UoM1Y7qZ1BVP8YndB36RcFj5T0Lazw6LQH_IXVE0XQOCNhULDWVpE1ieBj8uTOr95TB'; //put your server key here
var fcm = new FCM(serverKey);

  const app = express.Router()
  

  app.get('/', Auth.isAuth, Auth.permisos(['Notificaciones'],'Ver'),async (req, res) => {
    try {
      const data = await Notificaciones.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ninguna notificación'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/chofer/:id', Auth.isChofer, async (req, res) => {
    try {
      const data = await Notificaciones.findNotifChofer(req.params.id)
      if(!data)
        res.status(404).json({message:`No existe el extra con el id ${req.params.id}`})
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/cliente/:id', Auth.isCliente, async (req, res) => {
    try {
      const data = await Notificaciones.findNotifCliente(req.params.id)
      if(!data)
        res.status(404).json({message:`No existen notificaciones`, status:'denied'})
      else
        res.status(200).json({status:'succes',data})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/', Auth.isAuth, Auth.permisos(['Notificaciones'],'Crear'),async (req, res) => {
    //console.log(req.body)
    var info = req.body;
    let rep = [];
    try {
      let datos = {
        titulo: info.titulo,
        cuerpo: info.cuerpo
      }
      const data2 = await Notificaciones.create(datos)
      for (let i = 0; i < info.tokencli.length; i++) {
        let cont_e = 0
        let cont_s = 0
        var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
          to: info.tokencli[i], 
          
          notification: {
              title: info.titulo, 
              body: info.cuerpo
          }
        };
        let dat = await fcm.send(message, function(err, response){
            if (err) {
              cont_e++
              if (cont_e === 1) {
                Notificaciones.updateCli(data2._id, info.clientes[i], 'No')
              }
               console.log('por este '+err)
            } else {
              cont_s++
              if (cont_s === 1) {
                Notificaciones.updateCli(data2._id, info.clientes[i], 'Si')
              }
                console.log("Successfully sent with response: ", response)
            }
        });
      }
      for (let i = 0; i < info.tokench.length; i++) {
        let cont_error = 0
        let cont_suces = 0
        var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
          to: info.tokench[i], 
          
          notification: {
              title: info.titulo, 
              body: info.cuerpo
          }
        };
        let dat = await fcm.send(message, function(err, response){
            if (err) {
              cont_error++
              if (cont_error === 1) {
                Notificaciones.updateCho(data2._id, info.choferes[i], 'No')
              }
               console.log('por este otro'+err)
            } else {
              cont_suces++
              if (cont_suces === 1) {
                Notificaciones.updateCho(data2._id, info.choferes[i], 'Si')
              }
                console.log("Successfully sent with response: ", response)
            }
        });
      }
      res.status(201).json("ok")
    } catch (error) {
      handleError(error, res)
    }
  })

  app.put('/', Auth.isAuth, async(req,res)=>{
    try {
      const data = await Notificaciones.update(req.body)
      res.status(200).json({status:'Success',data:data})
    } catch (error) {
      handleError(error,res)
    }
  })
  
  export default app