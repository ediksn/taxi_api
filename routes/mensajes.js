'use strict'

import express from 'express'
import { Mensaje } from '../api'
import { handleError } from '../Utils'
const accountSid = 'AC5b29b798e3c3841fdd3a8592b4e464c9';
const authToken = 'ef72dfeac67f2b628d6cff25a228fc64';
const client = require('twilio')(accountSid, authToken);
  const app = express.Router()

  app.post('/', async (req, res) => {
    console.log(req.body)
    try {
    //   const data = await Mensaje.verificar(req.body.telefono)
      //const chofer = await Chofer.update({_id:req.body.owner}, {$set:{vehiculos:req.body}})
      let data = await client.verify.services('VAf5766b482c933bd5b542fef52412d2d3')
        .verifications
        .create({to: req.body.telefono, channel: 'sms'})
        .then(verification => {
            return verification
            console.log(verification.sid)
        });
      res.status(201).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })
  app.post('/crearservicio', async (req, res) => {
    try {
        let data = await client.verify.services.create({friendlyName: 'My Verify Service'})
        .then(service =>{
            console.log(service.sid)
           
    //         "sid": "VAf5766b482c933bd5b542fef52412d2d3",
    // "accountSid": "AC5b29b798e3c3841fdd3a8592b4e464c9",
            return service
        })
        .catch(error =>{
            console.log(error)
            return error
        })
        
      //const chofer = await Chofer.update({_id:req.body.owner}, {$set:{vehiculos:req.body}})
      res.status(201).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })
  export default app