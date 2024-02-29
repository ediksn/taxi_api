'use strict'

import express from 'express'
import multer from 'multer'
import { Reserva, Trans} from '../models'
import { handleError } from '../Utils'
import { Auth } from '../middleware'
import { Login } from '../services'
import mongoose from 'mongoose'
const ObjectId = mongoose.Types.ObjectId;
var moment = require('moment');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/images/vehiculo/')
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
  
  const upload = multer({storage: storage})
  const app = express.Router()
  
  app.get('/', Auth.isAuth,async (req, res) => {
    try {
      const data = await Concepto.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ningun concepto'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })
  app.get('/graficas/comision/mes', Auth.isAuth, async (req, res) => {
    let dias = req.query.dias
      let cantidad = req.query.cantidad
      var desde = req.query.desde
      var hasta = req.query.hasta
      if(dias) {
        desde = moment().subtract(dias, 'days').format("YYYY-MM-DDTHH:mm");
      }else{
        desde = moment().subtract(7, 'days').format("YYYY-MM-DDTHH:mm");
      }
      if(desde && hasta) {
        hasta = moment(hasta).format("YYYY-MM-DD")
        desde =  moment(desde).format("YYYY-MM-DDTHH:mm")
        hasta = moment(hasta).add(24, 'hours');
      }else{
        hasta = moment().format("YYYY-MM-DDTHH:mm")
      }
      if(!cantidad) {
        cantidad = 10
      }
    try {
      Trans.aggregate([
        {
          $match:
          {    
            $and:
            [
              {
                'fecha': { $gte: new Date(desde), $lte: new Date(hasta)}   
              },
              {
                $or: [
                  {
                    'concepto' : {$eq: ObjectId('5c93a9660368c807786a9f3c')}
                  }
                ]
              }
            ]    
          }
        },
        {
          $project:
            {
              formato: { $dateToString: { format: "%Y-%m", date: "$fecha" }},
              total : 1,
              haber: 1,
              concepto: 1
            }
        },
        {
          $group: { _id: { 'fecha' : '$formato'}, conceptos: { $push: {concepto: "$concepto", haber: '$haber'}}}
        }

    ], function (err, result) {
        //5c93a9500368c807786a9f39==pago de viaje con saldo
        // 5c93a9570368c807786a9f3a==pago de viaje en efectivo
        // 5c93fec644962a0d7ab3ea36 == pago de viaje mediante paypal
        //5c93a9660368c807786a9f3c == comision de la empresa
        let fechas = []
        let saldo = {
          name: 'Saldo',
          data: [],
          // type: 'pie'
        }
        let efectivo = {
          name: 'Efectivo',
          data: [],
          // type: 'pie'
        }
        let paypal = {
          name: 'Comision',
          data: [],
          // type: 'pie'
        }
        let pieoptions = {
          labels: ['Paypal', 'Efectivo', 'Saldo']
        }
        let sal = 0
        let efec = 0
        let pay = 0
        for (let i = 0; i < result.length; i++) {
          fechas.push(moment(result[i]._id.fecha).format('MMMM'))
            sal = 0
            efec = 0
            pay = 0
          for (let e = 0; e < result[i].conceptos.length; e++) {
            if(result[i].conceptos[e].concepto.toString() == '5c93a9660368c807786a9f3c') {
              pay += result[i].conceptos[e].haber
            }
          }
          
          paypal.data.push(pay)
        }
        console.log(saldo.data)
        let series = []
        series.push(paypal)
        // series.push(pieoptions.labels)
        //series.push(paypal)
        //series.push(efectivo)
        //series.push(saldo)
        res.status(200).json({fechas, series})
        
    });
    } catch (error) {
      handleError(error, res)
    }
  })
  app.get('/chofer/', Auth.isAuth, async (req, res) => {
    let id= await Login.decodeTok(req.headers.authorization.split(' ')[1])
    let dias = req.query.dias
      let cantidad = req.query.cantidad
      var desde = req.query.desde
      var hasta = req.query.hasta
      let fecha = moment().format("YYYY-MM-DD")
      if(dias) {
        desde = moment().subtract(dias, 'days').format("YYYY-MM-DDTHH:mm");
      }else{
        desde = moment(fecha).subtract(3, 'days').format("YYYY-MM-DDTHH:mm");
      }
      if(desde && hasta) {
        hasta = moment(hasta).format("YYYY-MM-DD")
        desde =  moment(desde).format("YYYY-MM-DDTHH:mm")
        hasta = moment(hasta).add(24, 'hours')
      }else{
        hasta = moment(fecha).add(24, 'hours')
      }
      if(!cantidad) {
        cantidad = 10
      }
    try {
      console.log('desde')
      console.log(desde)
      console.log('hasta')
      console.log(hasta)
      Trans.aggregate([
        {
          $match:
          {    
            $and:
            [
              {
                'fecha': { $gte: new Date(desde), $lte: new Date(hasta)}   
              },
              {
                'driver': {$eq: ObjectId(id.sub)}
              },
              {
                $or: [
                  {
                    'concepto' : {$eq: ObjectId('5c93a95f0368c807786a9f3b')}
                  },
                  {
                  'concepto' : {$eq: ObjectId('5c98f581c7e56806017641de')}
                  }
                ]
              }
            ]    
          }
        },
        {
          $project:
            {
              formato: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" }},
              total : 1,
              haber: 1,
              concepto: 1
            }
        },
        {
          $group: { _id: { 'concepto' : '$formato'}, haber: { $push: {state: "$haber"},}}
        },
        {
          $sort : { formato : 1 }
        }

    ], function (err, result) {
      console.log(result)
      //5c98f581c7e56806017641de == Comision por pago de viaje con PayPal
      //5c93a95f0368c807786a9f3b == Abono al chofer por viaje realizado
        let fechas = []
        let transacciones = []
        let total = 0
        let data = []
        let fech = []
        let viajes = 0
        for (let j = 0; j < 4; j++) {
          fech.push(moment(fecha).subtract(j, 'days').format("YYYY-MM-DD"))
        }
        console.log(fech)
        for (let i = 0; i < result.length; i++) {
          //console.log(i)
          //console.log(moment(fecha).subtract(i, 'days').format("YYYY-MM-DD"))
          fechas.push(result[i]._id.concepto)
          for (let e = 0; e < result[i].haber.length; e++) {
            transacciones.push(result[i].haber[e].state)
             
            total += result[i].haber[e].state
          }
          viajes = result[i].haber.length
          let index = fech.indexOf(result[i]._id.concepto)
          if(index > -1) {
            fech.splice(index, 1)
          }
          console.log(fech)
          data.push({fecha: result[i]._id.concepto, transacciones: transacciones, total: total, viajes: viajes})
          transacciones= []
          viajes = 0
        }
        for (let k = 0; k < fech.length; k++) {
          data.push({fecha: fech[k], transacciones: [], total: 0})
        }
        function sortFunction(a,b){  
          var dateA = new Date(a.fecha).getTime();
          var dateB = new Date(b.fecha).getTime();
          return dateA > dateB ? -1 : 1;  
        }; 
        let dat = data.sort(sortFunction)
        for (let y = 0; y < data.length; y++) {
          console.log(data[y])
          data[y].fecha = moment(data[y].fecha).format("DD-MM")
        }
        res.status(200).json({data: data})
        //return {paypal, efectivo, saldo, total, comision}
    });
    } catch (error) {
      handleError(error, res)
    }
  })
  app.get('/resumen/pagos', Auth.isAuth, async (req, res) => {
    let dias = req.query.dias
      let cantidad = req.query.cantidad
      var desde = req.query.desde
      var hasta = req.query.hasta
      if(dias) {
        desde = moment().subtract(dias, 'days').format("YYYY-MM-DDTHH:mm");
      }else{
        desde = moment().subtract(7, 'days').format("YYYY-MM-DDTHH:mm");
      }
      if(desde && hasta) {
        hasta = moment(hasta).format("YYYY-MM-DD")
        desde =  moment(desde).format("YYYY-MM-DDTHH:mm")
        hasta = moment(hasta).add(24, 'hours');
      }else{
        hasta = moment().format("YYYY-MM-DDTHH:mm")
      }
      if(!cantidad) {
        cantidad = 10
      }
      console.log('hasta')
      console.log(hasta)
    try {
      Trans.aggregate([
        {
          $match:
          {    
            $and:
            [
              {
                'fecha': { $gte: new Date(desde), $lte: new Date(hasta)}   
              },
              {
                $or: [
                  {
                    'concepto' : {$eq: ObjectId('5c93a9500368c807786a9f39')}
                  },
                  {
                    'concepto' : {$eq: ObjectId('5c93a9570368c807786a9f3a')}
                  },
                  {
                    'concepto' : {$eq: ObjectId('5c93fec644962a0d7ab3ea36')}
                  },
                  {
                    'concepto' : {$eq: ObjectId('5c93a9660368c807786a9f3c')}
                  }
                ]
              }
            ]    
          }
        },
        {
          $project:
            {
              formato: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" }},
              total : 1,
              haber: 1,
              concepto: 1
            }
        },
        {
          $group: { _id: { 'concepto' : '$concepto'}, haber: { $sum: '$haber'}}
        }

    ], function (err, result) {
        let paypal = 0
        let efectivo = 0
        let saldo = 0
        let comision = 0
        for (let i = 0; i < result.length; i++) {
          if(result[i]._id.concepto.toString() === '5c93fec644962a0d7ab3ea36') {
            paypal = result[i].haber
          }else if(result[i]._id.concepto.toString() === '5c93a9500368c807786a9f39') {
            saldo = result[i].haber
          }else if(result[i]._id.concepto.toString() === '5c93a9570368c807786a9f3a') {
            efectivo = result[i].haber
          }else if(result[i]._id.concepto.toString() === '5c93a9660368c807786a9f3c') {
            comision = result[i].haber
          }
        }
        let total = paypal + saldo + efectivo
        res.status(200).json({paypal, efectivo, saldo, total, comision})
        //return {paypal, efectivo, saldo, total, comision}
    });
    } catch (error) {
      handleError(error, res)
    }
  })
  app.get('/viajes/mes', Auth.isAuth, async (req, res) => {
    let dias = req.query.dias
      let cantidad = req.query.cantidad
      var desde = req.query.desde
      var hasta = req.query.hasta
      if(dias) {
        desde = moment().subtract(dias, 'days').format("YYYY-MM-DDTHH:mm");
      }else{
        desde = moment().subtract(7, 'days').format("YYYY-MM-DDTHH:mm");
      }
      if(desde && hasta) {
        hasta = moment(hasta).format("YYYY-MM-DD")
        desde =  moment(desde).format("YYYY-MM-DDTHH:mm")
        hasta = moment(hasta).add(24, 'hours');
      }else{
        hasta = moment().format("YYYY-MM-DDTHH:mm")
      }
      if(!cantidad) {
        cantidad = 10
      }
    try {
      Reserva.aggregate([
        {
          $match:
          {    
            'fecha': { $gte: new Date(desde), $lte: new Date(hasta)}       
          }
        },
        {
          $project:
            {
              formato: { $dateToString: { format: "%Y-%m", date: "$fecha" }},
              estatus : 1,
              costo: 1
            }
        },
        {
            $group: { _id: { 'fecha' : '$formato'} ,status: { $push: {state: "$estatus", costo: '$costo'}}, count: {$sum: 1}, }
        },
        { $sort : { _id : 1 } }
    ], function (err, result) {
        if (err) {
           console.log(err)
        } else {
          let fechas = []
          let series = []
          let terminado = {
            name: 'Viajes',
            data: [],
            type: 'bar'
          }
          let progreso = {
            name: 'Viajes en Progreso',
            data: [],
            type: 'bar'
          }
          let cancelado = {
            name: 'Viajes Cancelados',
            data: [],
            type: 'bar'
          }
          let total = 0
          let cancelados = 0
          let co = 0
          let pr = 0
          let ca = 0
          let costo = 0
          for (let i = 0; i < result.length; i++) {
            fechas.push(moment(result[i]._id.fecha).format('MMMM'))
            
            for (let e = 0; e < result[i].status.length; e++) {
              
              if(result[i].status[e].state === 'Terminado'){
                co = co + 1
                total += result[i].count
                if(result[i].status[e].costo) {
                  console.log(result[i].status[e].costo)
                  costo += result[i].status[e].costo
                }else {
                  costo += 0
                }
              }
              if(result[i].status[e].state === 'Aceptada'){
                pr = pr + 1
              }
              if(result[i].status[e].state === 'Cancelada'){
                ca = ca + 1
                cancelados += 1
              }
            }
            terminado.data.push(co)
            
            co = 0
            pr = 0
            ca = 0
          }
          series.push(terminado)
          res.status(200).json({total_monto: costo,total,cancelados, fechas: fechas, series: series })
        }
    });
    } catch (error) {
      handleError(error, res)
    }
  })
  app.get('/viajes/monto', Auth.isAuth, async (req, res) => {
    let dias = req.query.dias
      let cantidad = req.query.cantidad
      var desde = req.query.desde
      var hasta = req.query.hasta
      if(dias) {
        desde = moment().subtract(dias, 'days').format("YYYY-MM-DDTHH:mm");
      }else{
        desde = moment().subtract(7, 'days').format("YYYY-MM-DDTHH:mm");
      }
      if(desde && hasta) {
        hasta = moment(hasta).format("YYYY-MM-DD")
        desde =  moment(desde).format("YYYY-MM-DDTHH:mm")
        hasta = moment(hasta).add(24, 'hours');
      }else{
        hasta = moment().format("YYYY-MM-DDTHH:mm")
      }
      if(!cantidad) {
        cantidad = 10
      }
    try {
      Reserva.aggregate([
        {
          $match:
          {    
            'fecha': { $gte: new Date(desde), $lte: new Date(hasta)}       
          }
        },
        {
          $project:
            {
              formato: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" }},
              estatus : 1,
              costo: 1
            }
        },
        {
            $group: { _id: { 'fecha' : '$formato'} ,status: { $push: {state: "$estatus", costo: '$costo'}}, count: {$sum: 1}}
        },
        { $sort : { _id : 1 } }
    ], function (err, result) {
        if (err) {
           console.log(err)
        } else {
          let fechas = []
          let series = []
          let terminado = {
            name: 'Viajes Completados',
            data: [],
            type: 'bar'
          }
          let progreso = {
            name: 'Viajes en Progreso',
            data: [],
            type: 'bar'
          }
          let cancelado = {
            name: 'Viajes Cancelados',
            data: [],
            type: 'bar'
          }
          let total = 0
          let cancelados = 0
          let co = 0
          let pr = 0
          let ca = 0
          let monto = 0
          for (let i = 0; i < result.length; i++) {
            fechas.push(result[i]._id.fecha)
            total += result[i].count
            monto += result[i].status.costo
            for (let e = 0; e < result[i].status.length; e++) {

              if(result[i].status[e].state === 'Terminado'){
                co = co + 1
              }
              if(result[i].status[e].state === 'Aceptada'){
                pr = pr + 1
              }
              if(result[i].status[e].state === 'Cancelada'){
                ca = ca + 1
                cancelados += 1
              }
            }
            terminado.data.push(co)
            progreso.data.push(pr)
            cancelado.data.push(ca)
            
            co = 0
            pr = 0
            ca = 0
          }
          series.push(terminado, progreso, cancelado)
          res.status(200).json({total,cancelados, fechas: fechas, series: series })
        }
    });
    } catch (error) {
      handleError(error, res)
    }
  })
  app.get('/viajes', Auth.isAuth, async (req, res) => {
    let dias = req.query.dias
      let cantidad = req.query.cantidad
      var desde = req.query.desde
      var hasta = req.query.hasta
      if(dias) {
        desde = moment().subtract(dias, 'days').format("YYYY-MM-DDTHH:mm");
      }else{
        desde = moment().subtract(7, 'days').format("YYYY-MM-DDTHH:mm");
      }
      if(desde && hasta) {
        hasta = moment(hasta).format("YYYY-MM-DD")
        desde =  moment(desde).format("YYYY-MM-DDTHH:mm")
        hasta = moment(hasta).add(24, 'hours');
      }else{
        hasta = moment().format("YYYY-MM-DDTHH:mm")
      }
      if(!cantidad) {
        cantidad = 10
      }
    try {
      Reserva.aggregate([
        {
          $match:
          {    
            'fecha': { $gte: new Date(desde), $lte: new Date(hasta)}       
          }
        },
        {
          $project:
            {
              formato: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" }},
              estatus : 1
            }
        },
        {
            $group: { _id: { 'fecha' : '$formato'} ,status: { $push: {state: "$estatus"}}, count: {$sum: 1}}
        },
        { $sort : { _id : 1 } }
    ], function (err, result) {
        if (err) {
           console.log(err)
        } else {
          let fechas = []
          let series = []
          let terminado = {
            name: 'Viajes Completados',
            data: [],
            type: 'bar'
          }
          let progreso = {
            name: 'Viajes en Progreso',
            data: [],
            type: 'bar'
          }
          let cancelado = {
            name: 'Viajes Cancelados',
            data: [],
            type: 'bar'
          }
          let total = 0
          let cancelados = 0
          let co = 0
          let pr = 0
          let ca = 0
          for (let i = 0; i < result.length; i++) {
            fechas.push(result[i]._id.fecha)
            total += result[i].count
            for (let e = 0; e < result[i].status.length; e++) {
              if(result[i].status[e].state === 'Terminado'){
                co = co + 1
              }
              if(result[i].status[e].state === 'Aceptada'){
                pr = pr + 1
              }
              if(result[i].status[e].state === 'Cancelada'){
                ca = ca + 1
                cancelados += 1
              }
            }
            terminado.data.push(co)
            progreso.data.push(pr)
            cancelado.data.push(ca)
            
            co = 0
            pr = 0
            ca = 0
          }
          series.push(terminado, progreso, cancelado)
          res.status(200).json({total,cancelados, fechas: fechas, series: series })
        }
    });
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/ventas', async (req, res) => {
    
    Order.aggregate([
        {
            $project:
            {
                formato: { $dateToString: { format: "%Y-%m-%d", date: "$order_time" }},
                products : 1,
                total: { $toDecimal: '$total'}
            }
        },
        {
            $group : {
                _id: { 'fecha' : '$formato' },
                totalPrice: { $sum: '$total'},
                productos: { $addToSet: '$products'},
                count: { $sum: 1 },
                fecha: { $addToSet: '$formato'}
            }
        },
        {
            $sort : { fecha : 1 } ,
        }
    ], function (err, result) {
        if (err) {
           console.log(err)
        } else {
            let total = []
            let fecha= []
            let cantidad= []
            let productos = []
            for (let i = 0; i < result.length; i++) {
                let tot = 0
                if(result[i].productos.length > 1) {
                    for (let x = 0; x < result[i].productos.length; x++) {
                        tot += result[i].productos[x].length
                    }
                }else{
                    tot = result[i].productos[0].length
                }
                productos.push(tot)
                total.push(parseFloat(result[i].totalPrice))
                cantidad.push(result[i].count)
                fecha.push(result[i]._id.fecha)

            }
            res.status(200).json({productos: productos, total: total, cantidad: cantidad, fecha:fecha})
        }
    });
})
  export default app