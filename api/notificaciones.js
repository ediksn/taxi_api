'use strict'

import { Notificaciones } from '../models'
import Debug from 'debug'
import { Login } from '../services'
var FCM = require('fcm-node');
var serverKey = 'AAAAHw3ngvg:APA91bHeCKCrTZ9W1_Pf1CuP4wIhfr8kUo7HiunGryNSKy8TnGAuJQhYJ4-iH272ee89CGsk9UoM1Y7qZ1BVP8YndB36RcFj5T0Lazw6LQH_IXVE0XQOCNhULDWVpE1ieBj8uTOr95TB'; //put your server key here
var fcm = new FCM(serverKey);
const debug = new Debug('taxi:server:api:settings')

export default {

  find: () => {
    debug(`Finding Extras for homepage with limit.`)
    return Notificaciones.find().populate('clientes.clientes').populate('choferes.choferes')
  },

  findNotifChofer: (_id) => {
    debug(`Find Notificaciones with id: ${_id}`)
    return Notificaciones.find({"choferes.choferes":_id}).sort({createdAt:-1})
  },
  
  findNotifCliente: (_id) => {
    debug(`Find Notificaciones with id: ${_id}`)
    return Notificaciones.find({"clientes.clientes":_id}).sort({createdAt:-1})
  },

  create: (q) => {
    debug(`Creating new Notification`)
    const notif = new Notificaciones(q)
    return notif.save()
  },

  updateCli: (id, user, error) => {
    debug(`update new Notification`)
    return Notificaciones.findById(id)
    .then(data => {
        data.clientes.push({clientes: user, entregado: error})
        return data.save() 
    })
  },

  updateCho: (id, user, error) => {
    debug(`update new Notification`)
    return Notificaciones.findById(id)
    .then(data => {
        data.choferes.push({choferes: user, entregado: error})
        return data.save() 
    })
  },

  update:(q)=>{
    debug(`Update nofitication: ${q._id}`)
    return Notificaciones.updateOne({_id:q._id},{$set:q})
  },

  enviar: (token, titulo, cuerpo, data, tipo) => {
      //console.log('se ejecuta notifiaciones')
    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        to: token, 
        
        notification: {
            title: titulo, 
            body: cuerpo
        },
        data: {  //you can send only notification or only data(or include both)
            data: data,
            tipo: tipo
        },
        android: {
          notification: {
              sound: 'default'
          },
        },
        apns: {
          payload: {
              aps: {
                  sound: 'default'
              },
          },
        },
        topic: 'X'
    };

    
    
    fcm.send(message, function(err, response){
        if (err) {
            console.log('error found', err);
        } else {
            //console.log("Successfully sent with response: ", response)
            return response
        }
    });
  },
}