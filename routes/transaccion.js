'use strict'

import express from 'express'
import multer from 'multer'
import { Trans, Chofer, Cliente, Retiros, Secuencia, Reserva, Pago, Dev} from '../api'
import {Settings} from '../models/index'
import { handleError } from '../Utils'
import io from 'socket.io-client';
const socket = io(server);
import { Auth } from '../middleware'
import { Login } from '../services'
import {server} from '../Utils'
import pago from '../models/pago';
import { db } from '../config';
import { ECHILD } from 'constants';
const moment = require('moment');
const paypal = require('paypal-rest-sdk')
const path = require('path')
const ejs = require('ejs')
const axios = require('axios');
const https = require('https');
const fs = require('fs');
paypal.configure({
  mode:'sandbox',
  client_id:'AQIgfrg28GpEwKJXNtpW7Nte7mPocfTf9VdjBnm0pqqcuFDOGP1IMeoKFtGkTi6Km7EFpDO8zaIQ5Cqx',
  client_secret:'ENln24vzz7IrUeGwk3XONjAx7e6i7TfivxjRTHgNUUyzzeahMsriByCPEhcSO3dE8Zoun0jA1s1nU1OY'
})

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
  
  app.get('/',Auth.isUsuario,async (req, res) => {
    try {
      const data = await Trans.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun transaccion'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin',Auth.isUsuario,Auth.permisos(['Reporte de Transacciones'],'Ver'),async (req, res) => {
    try {
      const data = await Trans.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun transaccion'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/fechas/:x/:y', Auth.isUsuario,Auth.permisos(['Reporte de Transacciones'],'Ver'), async (req, res) => {
    try {
      const data = await Trans.findFechas(req.params.x,req.params.y)
      if(data.length==0){
        res.status(404).json({message:'No existe ninguna transacción'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/concepto/:id',Auth.isUsuario,async (req, res) => {
    try {
      const data = await Trans.findByConcepto(req.params.id)
      if(data.length==0){
        res.status(404).json({message:'No existe ninguna transaccion'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/t_pago',  async (req, res) => {
    try {
      let pago={}
      pago.info=[req.params]
      const data = await Pago.create(pago)
      res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/t_pago',async(req, res)=>{
    try {
      let pago={}
      pago.info=[req.body]
      const data = await Pago.create(pago)
      res.status(200).json(data)
    } catch (error) {
      handleError(error,res)
    }
  })

  app.post('/paypal',async(req, res)=>{
    let data = req.body
    console.log(data)
    var create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": "paypal"
      },
      "redirect_urls": {
          "return_url": `${server}/api/trans/succes?userId=${req.body.cliente}&tipo=${req.body.tipo}&reser=${req.body.reserva}`,
          "cancel_url": `${server}/api/trans/canceluserId=${req.body.cliente}&tipo=${req.body.tipo}&reser=${req.body.reserva}`
      },
      "transactions": [{
          "amount": {
              "currency": "USD",
              "total": data.costo
          }
      }]
    };
  
    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
        } else {
            console.log("Create Payment Response");
            res.redirect(payment.links[1].href)
        }
    });
  })

  app.get('/succes', async(req,res)=>{
    var PayerID = req.query.PayerID;
    var paymentId = req.query.paymentId;
    var cliente = req.query.userId
    var tipo = req.query.tipo
    var reserva = req.query.reserva
    var execute_payment_json = {
        payer_id: PayerID
    };

    paypal.payment.execute(paymentId, execute_payment_json, async(
        error,
        payment
    )=>{
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log("Get Payment Response");
            let trans = {}
            let total = JSON.parse(payment.transactions[0].amount.total)
            trans.cliente = cliente
            trans.tipo = 'PayPal'
            trans.payer_info = payment.payer.payer_info
            trans.pay_id=payment.id
            trans.total = total
            if(tipo&&tipo==='recarga'){
              trans.concepto="5c9532a571b786278b901709"
              let cli = await Cliente.findById(cliente)
              if(cli.bloqueado&&cli.bloqueado>0&&total>=cli.bloqueado){
                cli.saldo?cli.saldo += total-cli.bloqueado: cli.saldo = total-cli.bloqueado
                cli.bloqueado = 0
              }else if(cli.bloqueado&&cli.bloqueado>0&&total<cli.bloqueado){
                cli.bloqueado = total-cli.bloqueado
              }
              else{
                cli.saldo?cli.saldo += total:cli.saldo=total
              }
              await Cliente.update(cli)
            }
            else{
              trans.concepto = "5c93fec644962a0d7ab3ea36"
              let res = await Reserva.findById(reserva)
              socket.emit('pago',{chofer:res.driver._id})
            }
            let data = await Trans.create(trans)
            let reser ={
              _id:reserva,
              trans_id:data._id
            }
            await Reserva.update(reser)
            console.log(data._id)
            res.render('../view/succes.ejs', {id:data._id})
        }
    });

  })

  app.get('/cancel', async(req,res)=>{
    res.render('../view/cancel.ejs')
  })

  app.post('/retiro/chofer', Auth.isChofer, upload.single('imagen'), async (req, res) => {
    try {
      let data = req.body
      let chof = await Chofer.findById(data.driver)
      chof.saldo -= data.total
      chof.bloqueado?chof.bloqueado += JSON.parse(data.total):chof.bloqueado=JSON.parse(data.total)
      console.log(chof.bloqueado)
      await Chofer.update(chof)
      data.haber = data.total
      if(data.tipo==='PayPal'){
        data.concepto='5c9d2d11541fdc020298e08e'
      }
      else{
        data.concepto='5c93a98c0368c807786a9f40'
      }
      let trans = await Trans.create(data)
      const seq2 = await Secuencia.findSec()
      console.log(seq2)
      const sec = seq2[0].secuencia + 1
      const seq = await Secuencia.create({secuencia: sec})
      console.log(seq)
      let q = req.body
      q.id = seq.secuencia
      q.chofer = q.driver
      q.monto = q.total
      socket.emit('actualizar_retiro',{message:'Actualizacion de retiro'})
      const ret = await Retiros.create(q)
      console.log(ret)
      res.status(200).json({status:'Success', trans: trans, retiro:ret})
    } catch (error) {
      handleError(error,res)
    }
  })

  app.post('/', Auth.isAuth, upload.single('imagen'), async (req, res) => {
    let trans
    let settings = await Settings.findOne()
    let reserva = await Reserva.findById(req.body.reserva)
    let chof = reserva.driver
    const total = JSON.parse(req.body.total)
    try {
        let data
        let data1={}
        let data2={}
        let data3={}
        let reser={}
        let user = {}
        let arr =[]
        if(req.body.saldo){
          user = await Cliente.findById()
          data = req.body
          data.concepto="5c93a9730368c807786a9f3d"
          data.total=total
          trans = await Trans.create(data)
          res.status(200).json({status:'Success', data: trans})  
        }
        else{
          let tot
          tot = JSON.parse(req.body.total)
          switch(req.body.tipo){
            case 'Efectivo':
              //Pago de viaje en efectivo          
              data = req.body
              data.total = tot
              data.concepto = "5c93a9570368c807786a9f3a"
              data.driver = chof._id
              data.cliente = reserva.user._id
              data.reserva=req.body.reserva
              arr.push(data)
              //Debito al saldo de chofer por comisión de viaje pagado en efectivo
              chof.saldo -= (tot*(settings.comision / 100))
              await Chofer.update(chof)
              data1.total = (tot*(settings.comision / 100))
              data1.driver = chof._id
              data1.cliente = reserva.user._id
              data1.reserva=req.body.reserva
              data1.concepto ="5c93a9860368c807786a9f3f"
              arr.push(data1)
              // Abono a la empresa por comision de viaje realizado en efectivo
              data3.total = (tot*(settings.comision / 100))
              data3.driver = chof._id
              data3.cliente = reserva.user._id
              data3.concepto ="5c93a9660368c807786a9f3c"
              data3.reserva=req.body.reserva
              arr.push(data3)
              trans = await Trans.createMany(arr)
              reserva.trans_id=trans[trans.length-1]._id
              await Reserva.update(reserva)
              socket.emit('actualizar_trans',{message:'Actualizacion de transaccion'})
              res.status(200).json({status:'Success', data: trans})              
              break;
            case 'Saldo':
              //Pago de viaje con saldo
              data = req.body
              data.total = tot*(settings.comision / 100)
              data.concepto = "5c93a9500368c807786a9f39"
              data.driver = chof._id
              data.cliente = reserva.user._id
              data.reserva=req.body.reserva
              arr.push(data)
              chof.saldo+=(tot-(tot*(settings.comision / 100)))
              await Chofer.update(chof)
              // Debito al cliente
              user = reserva.user
              user.saldo -= tot
              user.saldo<0?user.bloqueado=tot-user.saldo:user.bloqueado=0
              await Cliente.update(user)
              // Transaccion de debito al cliente
              data1.total = tot
              data1.concepto = "5c93a9780368c807786a9f3e"
              data1.driver = chof._id
              data1.cliente = reserva.user._id
              data1.reserva=req.body.reserva
              arr.push(data1)
              // Transaccion de abono a la empresa
              data2.total = tot*(settings.comision / 100)
              data2.driver = chof._id
              data2.cliente = reserva.user._id
              data2.concepto="5c93a9660368c807786a9f3c"
              data2.reserva=req.body.reserva
              arr.push(data2)
              // Transaccion de abono al chofer
              data3.total = tot-(tot*(settings.comision / 100))
              data3.driver = chof._id
              data3.cliente = reserva.user._id
              data3.concepto = "5c93a95f0368c807786a9f3b"
              data3.reserva=req.body.reserva
              arr.push(data3)
              trans = await Trans.createMany(arr)
              reser.trans_id = trans[trans.length-1]._id
              await Reserva.update(reserva)
              socket.emit('actualizar_trans',{message:'Actualizacion de transaccion'})
              res.status(200).json({status:'Success', data: trans}) 
              break
            case 'PayPal':
              //Pago de viaje mediante Paypal
              data = req.body
              data.total = tot*(settings.comision / 100)
              data.driver = chof._id
              data.cliente = reserva.user._id
              data.concepto="5c93fec644962a0d7ab3ea36"
              data.reserva=req.body.reserva
              arr.push(data)
              //Transaccion de comision del chofer por viaje con paypal 
              data1.tipo=''
              data1.total = (tot-(tot*(settings.comision / 100)))
              data1.driver = chof._id
              data1.cliente = reserva.user._id
              data1.concepto = "5c98f54f6cdf8b0601ea7d5e"
              data1.reserva=req.body.reserva
              arr.push(data1)
              chof.saldo+=(tot-(tot*(settings.comision / 100)))
              await Chofer.update(chof)
              //Debito al cliente
              user = reserva.user
              user.saldo-=tot
              user.bloqueado = tot
              await Cliente.update(user)
              data2.driver = chof._id
              data2.cliente = reserva.user._id
              data2.total = tot
              data2.concepto = "5d711315dcfa24489e58fe0c"
              data2.reserva=req.body.reserva
              arr.push(data2)
              // Transaccion de cobro de comision de viaje por paypal
              data3.total = tot*(settings.comision / 100)
              data3.driver = chof._id
              data3.cliente = reserva.user._id
              data3.concepto="5c98f581c7e56806017641de"
              data3.haber = tot*(settings.comision / 100)
              data3.reserva=req.body.reserva
              arr.push(data3)
              trans = await Trans.createMany(arr)
              reser.trans_id=trans[trans.length-1]._id
              await Reserva.update(reser)
              socket.emit('actualizar_trans',{message:'Actualizacion de transaccion'})
              res.status(200).json({status:'Success', data: trans})
              break
            case 'Tarjeta':
              data = req.body
              data.comision = tot*(settings.comision / 100)
              data.haber = tot
              arr.push(data)
              data.reserva=req.body.reserva
              //Transaccion de comision del chofer por viaje con Tarjeta 
              data1.tipo=''
              data1.total = (tot-(tot*(settings.comision / 100)))
              data1.haber = tot
              data1.driver = chof._id
              data1.cliente = reserva.user._id
              data1.concepto = "5d66958efc0df8087a508174"
              data1.reserva=req.body.reserva
              arr.push(data1)
              chof.saldo+=(tot-(tot*(settings.comision / 100)))
              await Chofer.update(chof)
              //Debito al cliente
              user = reserva.user
              user.saldo-=tot
              user.bloqueado = tot
              await Cliente.update(user)
              data2.driver = chof._id
              data2.cliente = reserva.user._id
              data2.haber = tot
              data2.concepto = "5cc748c04f87ed01fd55dd90"
              data2.reserva=req.body.reserva
              arr.push(data2)
              // Transaccion de cobro de comision de viaje por Tarjeta
              data3.total = tot*(settings.comision / 100)
              data3.driver = chof._id
              data3.cliente = reserva.user._id
              data3.concepto="5d6695a2fc0df8087a508175"
              data3.haber = tot
              data3.reserva=req.body.reserva
              arr.push(data3)
              trans = await Trans.createMany(arr)
              reser.trans_id=trans[trans.length-1]._id
              await Reserva.update(reser)
              socket.emit('actualizar_trans',{message:'Actualizacion de transaccion'})
              res.status(200).json({status:'Success', data: trans})
              break
            default:
              res.status(500).json({status:'Denied', message:'No se especifico el tipo de transaccion'})
            break     
      }
        }
        
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/devolucion',Auth.isCliente, async(req,res)=>{
    try {
      let id = await Login.decodeTok(req.headers.authorization.split(' ')[1])
      let arr = await Trans.findByReserva(req.body.reserva)
      let transa = []
      let trans ={}
      let obj = arr.find(el=>el.concepto && el.concepto._id.toString() === '5d70276fdcfa24489e58fe02')
      if(obj){
        let tot
        if(obj.total.toString().includes('.')){
          tot = obj.total.toString().replace('.','')
        }else{
          tot = obj.total.toString()+'00'
        }
        console.log('monto  '+tot)
        const payload = {
          Channel: 'EC',
          Store: '39272770033',
          CardNumber: "",
          Expiration:"",
          CVC: '',
          PosInputMode: 'E-Commerce',
          TrxType: 'Refund',
          Amount: tot,
          Itbis: '0000',
          CurrencyPosCode: '$',
          Payments: '1',
          Plan: '0',
          OriginalDate:moment(obj.fecha).format('YYYYMMDD'),
          OriginalTrxTicketNr:'',
          AcquirerRefData: '',
          RRN: null,
          AzulOrderId:obj.AzulOrderId,
          CustomerServicePhone: '809-111-2222',
          OrderNumber: '',
          CustomOrderId: 'ABC123',
          ECommerceUrl: 'appolotaxi.com',
          DataVaultToken:'',
          SaveToDataVault:0
        };
    
        try {
          const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
            cert: fs.readFileSync(path.resolve(__dirname,'../public/cert-apolo-prod.crt')),
            key: fs.readFileSync(path.resolve(__dirname,'../public/apolo-produccion.key'))
          });
          const options = {
            httpsAgent,
            headers: {
              'Content-Type': 'application/json',
              Auth1: 'ApoloTaxiApp',
              Auth2: 'aqTaf5gNvVVv'
            }
          };
          const { data } = await axios.post(
            // 'https://pruebas.azul.com.do/webservices/JSON/Default.aspx',
            'https://pagos.azul.com.do/webservices/JSON/Default.aspx',
            payload,
            options
          );
          console.log(data)
          if(data.ResponseMessage==='APROBADA') {
            transa.push({
              total: obj.total,
              concepto:"5db0b2fbb6bbc67338035c01",
              cliente: obj.cliente._id,
              driver : obj.driver._id,
              reserva: req.body.reserva
            })
          }
          if(data.ResponseMessage==='RECHAZADA'||data.ResponseCode==='Error'||data.ResponseCode===''){
            throw {status:'denied',error:data.ErrorDescription}
          } 
        } catch (error) {
          throw error
        }
      }
      obj =  arr.find(el=>el.concepto && el.concepto._id.toString() === '5d6695a2fc0df8087a508175')
      if(obj){
        transa.push({
          concepto : '5db0b3c6b6bbc67338035c03',
          total : obj.total,
          cliente : obj.cliente._id,
          driver : obj.driver._id,
          reserva: req.body.reserva
        })
      }
      obj =  arr.find(el=>el.concepto && el.concepto._id.toString() === '5d66958efc0df8087a508174')
      if(obj){
        transa.push({
          concepto : '5db0b381b6bbc67338035c02',
          total : obj.total,
          cliente : obj.cliente._id,
          driver : obj.driver._id,
          reserva: req.body.reserva
        })
        await Chofer.update({_id:obj.driver._id, saldo: obj.driver.saldo-obj.total})
      }
      console.log(transa.length)
      console.log(transa)
      let data = await Trans.createMany(transa)
      console.log(data)
      res.status(200).json({status:'success',message:'Devolucion realizada exitosamente'})
    } catch (error) {
      console.log(error)
      if(error.status){
        res.status(200).json(error)
      }else handleError(error,res) 
    }
  })

  app.post('/pagos',  async (req, res) => {
    let trans={}
    let settings = await Settings.findOne()
    let reserva = await Reserva.findById(req.body.reserva)
    const tot = JSON.parse(req.body.total)
    console.log('-------Body---------')
    console.log(req.body)
    console.log('-------Body---------')
    if(req.body.tipo==='Tarjeta'){
      socket.emit('pago',{chofer:reserva.driver._id,cliente:reserva.user._id, estatus:'Pendiente'})
      let tarjeta
      if(reserva.user.tarjetas&&reserva.user.tarjetas.length>0){
        if(reserva.user.tarjeta_tmp&&reserva.user.tarjeta_tmp.default){
          tarjeta=reserva.user.tarjeta_tmp  
        }else{
          tarjeta = reserva.user.tarjetas.filter(el=>{
            return el.default===true
          })
          tarjeta=tarjeta[0]
        }
      }else{
        tarjeta=reserva.user.tarjeta_tmp
      }
      console.log('-------Tarjeta---------')
      console.log(tarjeta)
      console.log('-------Tarjeta---------')
      if(tarjeta){
        const payload = {
          Channel: 'EC',
          Store: '39272770033',
          CardNumber: "",
          Expiration:"",
          CVC: tarjeta.cvc,
          PosInputMode: 'E-Commerce',
          TrxType: 'Sale',
          Amount: req.body.total.toString().replace('.',''),
          Itbis: '0000',
          CurrencyPosCode: '$',
          Payments: '1',
          Plan: '0',
          AcquirerRefData: '1',
          RRN: null,
          CustomerServicePhone: '809-111-2222',
          OrderNumber: '',
          CustomOrderId: 'ABC123',
          ECommerceUrl: 'appolotaxi.com',
          DataVaultToken:tarjeta.token,
          SaveToDataVault:0
        };
  
        try {
          const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
            cert: fs.readFileSync(path.resolve(__dirname,'../public/cert-apolo-prod.crt')),
            key: fs.readFileSync(path.resolve(__dirname,'../public/apolo-produccion.key'))
          });
          const options = {
            httpsAgent,
            headers: {
              'Content-Type': 'application/json',
              Auth1: 'ApoloTaxiApp',
              Auth2: 'aqTaf5gNvVVv'
            }
          };
          const { data } = await axios.post(
            // 'https://pruebas.azul.com.do/webservices/JSON/Default.aspx',
            'https://pagos.azul.com.do/webservices/JSON/Default.aspx',
            payload,
            options
          );
          let user = reserva.user
          trans.total = tot
          trans.AzulOrderId=data.AzulOrderId
          trans.AzulAuthorizationCode=data.AuthorizationCode
          trans.Azul_RRN=data.RRN
          trans.Azul_estatus=data.ResponseMessage
          trans.Azul_Ticket=data.Azul_Ticket
          trans.cliente = user._id
          trans.driver = reserva.driver._id
          user.saldo += user.bloqueado
          user.bloqueado=0
          trans.concepto="5d70276fdcfa24489e58fe02"
          trans.reserva=req.body.reserva
          trans = await Trans.create(trans)
          console.log('-------Resultado de la transaccion---------')
          console.log(data)
          console.log('-------Resultado de la transaccion---------')
          if(reserva.user.tarjeta_tmp) await Cliente.update({_id:reserva.user._id,tarjeta_tmp:null})
          if(data.ResponseMessage==='APROBADA'){
            res.status(201).json(data)
            socket.emit('pago',{chofer:reserva.driver._id,cliente:reserva.user._id, estatus:'Aprobado'})
          }
          else{
            res.status(500).json(data)
            socket.emit('pago',{chofer:reserva.driver._id,cliente:reserva.user._id, estatus:'Rechazado'})
          }
        } catch (error) {
          socket.emit('pago',{chofer:reserva.driver._id,cliente:reserva.user._id, estatus:'Rechazado'})
          handleError(error,res)
        }
      }else {
        console.log('no hay tarjeta')
        res.status(500).json({estatus:'denied',message:'Error, no existe tarjeta'})
        socket.emit('pago',{chofer:reserva.driver._id,cliente:reserva.user._id, estatus:'Rechazado'})
      }
    }else{
      try{
      let user = reserva.user
      user.saldo+=user.bloqueado
      user.bloqueado=0
      trans.total = tot
      trans.cliente = user._id
      trans.driver = reserva.driver._id
      trans.concepto="5cc7496f4f87ed01fd55dd91"
      trans.reserva=req.body.reserva
      trans = await Trans.create(trans)
      socket.emit('pago',{chofer:reserva.driver._id,cliente:reserva.user._id ,estatus:'Aprobado', tipo:req.body.tipo})
      let ref = db.ref("reserva/"+req.body.reserva+'/tipo')
      await ref.set(req.body.tipo) 
      await Reserva.update({_id:req.body.reserva,tipo:req.body.tipo}) 
      res.status(200).json({status:'Success', data: trans})
      } catch (error) {
        socket.emit('pago',{chofer:reserva.driver._id,cliente:reserva.user._id,estatus:'Rechazado'})
        console.log(error)
        handleError(error, res)
      }
    }
  })

  app.post('/recarga/tarjeta',Auth.isCliente, async(req,res)=>{
    console.log(req.body)
    let id= await Login.decodeTok(req.headers.authorization.split(' ')[1])
    let user = await Cliente.findById(id.sub)
    let tarjeta
    if(user.tarjetas&&user.tarjetas.length>0){
      if(user.tarjeta_tmp&&user.tarjeta_tmp.default){
        tarjeta=user.tarjeta_tmp  
      }else{
        tarjeta = user.tarjetas.filter(el=>{
          return el.default===true
        })
        tarjeta=tarjeta[0]
      }
    }else{
      tarjeta=user.tarjeta_tmp
    }
    console.log(tarjeta)
    if(tarjeta){
      const payload = {
        Channel: 'EC',
        Store: '39272770033',
        CardNumber: "",
        Expiration:"",
        CVC: tarjeta.cvc,
        PosInputMode: 'E-Commerce',
        TrxType: 'Sale',
        Amount: req.body.total.toString().replace('.',''),
        Itbis: '0000',
        CurrencyPosCode: '$',
        Payments: '1',
        Plan: '0',
        AcquirerRefData: '1',
        RRN: null,
        CustomerServicePhone: '809-111-2222',
        OrderNumber: '',
        CustomOrderId: 'ABC123',
        ECommerceUrl: 'appolotaxi.com',
        DataVaultToken:tarjeta.token,
        SaveToDataVault:0
      };

      try {
        const httpsAgent = new https.Agent({
          rejectUnauthorized: false,
          cert: fs.readFileSync(path.resolve(__dirname,'../public/cert-apolo-prod.crt')),
          key: fs.readFileSync(path.resolve(__dirname,'../public/apolo-produccion.key'))
        });
        const options = {
          httpsAgent,
          headers: {
            'Content-Type': 'application/json',
            Auth1: 'ApoloTaxiApp',
            Auth2: 'aqTaf5gNvVVv'
          }
        };
        
        const { data } = await axios.post(
          // 'https://pruebas.azul.com.do/webservices/JSON/Default.aspx',
          'https://pagos.azul.com.do/webservices/JSON/Default.aspx',
          payload,
          options
        );
        let trans={}
        trans.total = req.body.total
        trans.AzulOrderId=data.AzulOrderId
        trans.AzulAuthorizationCode=data.AuthorizationCode
        trans.Azul_RRN=data.RRN
        trans.Azul_estatus=data.ResponseMessage
        trans.Azul_Ticket=data.Azul_Ticket
        user.saldo+=parseFloat(req.body.total)
        trans.concepto="5d76c1c69e976648f78c7f6d"
        trans = await Trans.create(trans)
        if(user.tarjeta_tmp) user.tarjeta_tmp=null
        await Cliente.update(user)
        console.log(data)
        if(data.ResponseMessage==='APROBADA')res.status(201).json({status:'succes',data:data})
        if(data.ResponseMessage==='RECHAZADA'||data.ResponseCode==='Error'||data.ResponseCode==='')res.status(500).json({status:'denied',data:data})
      } catch (error) {
        console.log(error)
        handleError(error,res)
      }
    }else {
      console.log('no hay tarjeta')
      res.status(500).json({status:'denied',message:'Error, no existe tarjeta'})
    }
  })

  app.put('/', Auth.isCliente, async (req, res) => {
    try {
      const data = await Trans.update(req.body)
      res.status(200).json({message: `La transaccion con el id ${req.body._id} ha sido actualizada exitosamente`, data})
    } catch (error) {
      handleError(error, res)
    }
  })
  
  export default app