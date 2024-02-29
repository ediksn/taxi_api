'use strict'

import express from 'express'
import multer from 'multer'
import { Reserva, Trans, Retiros, Chofer} from '../models'
import { handleError } from '../Utils'
import { Auth } from '../middleware'
import { Login } from '../services'
import mongoose from 'mongoose'
const ObjectId = mongoose.Types.ObjectId;
var moment = require('moment');
require('moment/locale/es')
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
  
  app.get('/', Auth.isAuth, async (req, res) => {
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
  app.get('/graficas/reserva/mes', Auth.isAuth, Auth.permisos(['Reporte de Reservas'],'Ver'), async (req, res) => {
    let dias = req.query.dias
      let cantidad = req.query.cantidad
      var desde = req.query.desde
      var hasta = req.query.hasta
      // if(dias) {
      //   desde = moment().subtract(dias, 'days').format("YYYY-MM-DDTHH:mm");
      // }else{
      //   desde = moment().subtract(1, 'year').format("YYYY-MM-DDTHH:mm");
      // }
      if(desde && hasta) {
        hasta = moment(hasta).format("YYYY-MM-DD")
        desde =  moment(desde).format("YYYY-MM-DDTHH:mm")
        hasta = moment(hasta).add(24, 'hours');
      }else{
        let year = moment().format("YYYY")
        hasta = moment().format("YYYY-MM-DDTHH:mm")
        desde = year + '-01-01'
      }
      if(!cantidad) {
        cantidad = 10
      }
    try {
      Reserva.aggregate([
        {
          $match:
          {    
            $and:
            [
              {
                'fecha': { $gte: new Date(desde), $lte: new Date(hasta)}   
              }
            ]    
          }
        },
        {
          $project:
            {
              formato: { $dateToString: { format: "%Y-%m", date: "$fecha" }},
              format: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" }},
              costo: 1,
              estatus: 1
            }
        },
        {
          $group: { _id: { 'fecha' : '$formato'}, format:{ $addToSet: '$format'}, estatus: { $push: {estatus: "$estatus", total: '$costo'}}}
        },
        {
          $sort : { format : 1 }
        }

    ], function (err, result) {
        // console.log(result[2])
        let fechas = []
        let terminado = {
          name: 'Ingresos por viajes terminados',
          data: [],
          type: 'line'
        }
        let ing = 0
        for (let i = 0; i < result.length; i++) {
          fechas.push(moment(result[i]._id.fecha).format('MMMM'))
            ing = 0
          for (let e = 0; e < result[i].estatus.length; e++) {
            if(result[i].estatus[e].estatus == 'Terminado') {
              ing += result[i].estatus[e].total
            }
          }
          let ingre = ing.toFixed(0)
          terminado.data.push(ingre)
        }
        let series = []
        series.push(terminado)
        res.status(200).json({fechas, series})
    });
    } catch (error) {
      handleError(error, res)
    }
  })
  app.get('/graficas/trans/mes', Auth.isAuth, Auth.permisos(['Reporte de Transacciones'],'Ver'), async (req, res) => {
      let dias = req.query.dias
      let cantidad = req.query.cantidad
      var desde = req.query.desde
      var hasta = req.query.hasta
      // console.log(desde)
      // if(dias) {
      //   desde = moment().subtract(dias, 'days').format("YYYY-MM-DDTHH:mm");
      // }else{
      //   desde = moment().subtract(1, 'year').format("YYYY-MM-DDTHH:mm");
      // }
      if(desde && hasta) {
        hasta = moment(hasta).format("YYYY-MM-DD")
        desde =  moment(desde).format("YYYY-MM-DDTHH:mm")
        hasta = moment(hasta).add(24, 'hours');
      }else{
        let year = moment().format("YYYY")
        hasta = moment().format("YYYY-MM-DDTHH:mm")
        desde = year + '-01-01'
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
                    'concepto' : {$eq: ObjectId('5c93a99c0368c807786a9f42')}
                  },
                  {
                    'concepto' : {$eq: ObjectId('5c93a9660368c807786a9f3c')}
                  },
                  {
                    'concepto' : {$eq: ObjectId('5c93a98c0368c807786a9f40')}
                  },
                  {
                    'concepto' : {$eq: ObjectId('5c9cecf637814d6a10e60e13')}
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
              format: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" }},
              total : 1,
              haber: 1,
              concepto: 1
            }
        },
        {
          $group: { _id: { 'fecha' : '$formato'}, format:{ $addToSet: '$format'}, conceptos: { $push: {concepto: "$concepto", total: '$total'}}}
        },
        {
          $sort : { format : 1 }
        }

    ], function (err, result) {
        //5c93a99c0368c807786a9f42== Devoluciones de dinero por concepto de disputa
        // 5c93a9660368c807786a9f3c== Abono a la empresa por comisión de viaje
        // 5c93a98c0368c807786a9f40 == Retiro del saldo del chofer a su cuenta bancaria
        //5c9cecf637814d6a10e60e13 == Retiro del saldo del chofer a su cuenta paypal
        let fechas = []
        let disputa = {
          name: 'Devoluciones de dinero por concepto de disputa',
          data: [],
          type: 'line'
        }
        let comision = {
          name: 'Abono a la empresa por comisión de viaje',
          data: [],
          type: 'line'
        }
        let rchoferb = {
          name: 'Retiro del saldo del chofer a su cuenta bancaria',
          data: [],
          type: 'line'
        }
        let rchoferp = {
          name: 'Retiro del saldo del chofer a su cuenta paypal',
          data: [],
          type: 'line'
        }
        let pieoptions = {
          labels: ['Paypal', 'Efectivo', 'Saldo']
        }
        let disp = 0
        let com = 0
        let rcb = 0
        let rcp = 0
        for (let i = 0; i < result.length; i++) {
          fechas.push(moment(result[i]._id.fecha).format('MMMM'))
            disp = 0
            com = 0
            rcb = 0
            rcp = 0
          for (let e = 0; e < result[i].conceptos.length; e++) {
            if(result[i].conceptos[e].concepto.toString() == '5c93a99c0368c807786a9f42') {
              disp += result[i].conceptos[e].total
            }else if(result[i].conceptos[e].concepto.toString() == '5c93a9660368c807786a9f3c') {
              com += result[i].conceptos[e].total
            }else if(result[i].conceptos[e].concepto.toString() == '5c93a98c0368c807786a9f40') {
              rcb += result[i].conceptos[e].total
            }else if(result[i].conceptos[e].concepto.toString() == '5c9cecf637814d6a10e60e13') {
              rcp += result[i].conceptos[e].total
            }
          }
          let dispu = Math.round(disp)
          let comp = Math.round(com)
          let rcbe = Math.round(rcb)
          let rcpe = Math.round(rcp)
          disputa.data.push(dispu)
          comision.data.push(comp)
          rchoferb.data.push(rcbe)
          rchoferp.data.push(rcpe)
        }
        let series = []
        series.push(disputa)
        series.push(comision)
        series.push(rchoferb)
        series.push(rchoferp)
        res.status(200).json({fechas, series})
        // res.status(200).json(result)
    });
    } catch (error) {
      handleError(error, res)
    }
  })
  app.get('/graficas/ciudad', Auth.isAuth, Auth.permisos(['Dashboard'],'Ver'), async (req, res) => {
    let dias = req.query.dias
      let cantidad = req.query.cantidad
      var desde = req.query.desde
      var hasta = req.query.hasta
      let contador = 0
      // if(dias) {
      //   desde = moment().subtract(dias, 'days').format("YYYY-MM-DDTHH:mm");
      // }else{
      //   desde = moment().subtract(1, 'year').format("YYYY-MM-DDTHH:mm");
      // }
      if(desde && hasta) {
        hasta = moment(hasta).format("YYYY-MM-DD")
        desde =  moment(desde).format("YYYY-MM-DDTHH:mm")
        hasta = moment(hasta).add(24, 'hours');
      }else{
        let year = moment().format("YYYY")
        hasta = moment().format("YYYY-MM-DDTHH:mm")
        desde = year + '-01-01'
      }
      if(!cantidad) {
        cantidad = 10
      }
    try {
      Reserva.aggregate([
        {
          $match:
          {    
            $and:
            [
              {
                'fecha': { $gte: new Date(desde), $lte: new Date(hasta)}   
              }
            ]    
          }
        },
        {
          $project:
            {
              formato: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" }},
              format: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" }},
              ciudad: 1,
              estatus:1
            }
        },
        {
          $unwind: "$ciudad"
        },
        {
          $group: { _id: { 'ciudades' : '$ciudad'}, format:{ $addToSet: '$format'}, count: { $sum: 1},estatus:{$addToSet:'$estatus'}}
        },
        {
          $sort : { format : 1 }
        }
    ], function (err, result) {
      // console.log(result)
        let pieoptions = []
        let series = []
        for (let i = 0; i < result.length; i++) {
          pieoptions.push(result[i]._id.ciudades)
          series.push(result[i].count)
        }

        res.status(200).json({series, pieoptions})
        
    });
    } catch (error) {
      handleError(error, res)
    }
  })
  app.get('/graficas/pagos', Auth.isAuth, Auth.permisos(['Dashboard'],'Ver'), async (req, res) => {
    let dias = req.query.dias
      let cantidad = req.query.cantidad
      var desde = req.query.desde
      var hasta = req.query.hasta
      // if(dias) {
      //   desde = moment().subtract(dias, 'days').format("YYYY-MM-DDTHH:mm");
      // }else{
      //   desde = moment().subtract(7, 'days').format("YYYY-MM-DDTHH:mm");
      // }
      if(desde && hasta) {
        hasta = moment(hasta).format("YYYY-MM-DD")
        desde =  moment(desde).format("YYYY-MM-DDTHH:mm")
        hasta = moment(hasta).add(24, 'hours');
      }else{
        let year = moment().format("YYYY")
        hasta = moment().format("YYYY-MM-DDTHH:mm")
        desde = year + '-01-01'
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
                    'concepto' : {$eq: ObjectId('5c93a9500368c807786a9f39')} // pago con saldo
                  },
                  {
                    'concepto' : {$eq: ObjectId('5c93a9570368c807786a9f3a')} // pago con efectivo
                  },
                  {
                    'concepto' : {$eq: ObjectId('5c93fec644962a0d7ab3ea36')} // pago con paypal
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
              format: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" }},
              total : 1,
              haber: 1,
              concepto: 1
            }
        },
        {
          $group: { _id: { 'fecha' : '$formato'}, format:{ $addToSet: '$format'}, conceptos: { $push: {concepto: "$concepto", total: '$total'}}}
        },
        {
          $sort : { format : 1 }
        }

    ], function (err, result) {
        //5c93a9500368c807786a9f39==pago de viaje con saldo
        // 5c93a9570368c807786a9f3a==pago de viaje en efectivo
        // 5c93fec644962a0d7ab3ea36 == pago de viaje mediante paypal
        let fechas = []
        let saldo = {
          // name: 'Saldo',
          data: [],
          // type: 'pie'
        }
        let efectivo = {
          // name: 'Efectivo',
          data: [],
          // type: 'pie'
        }
        let paypal = []
        let pieoptions = ['Paypal', 'Efectivo', 'Saldo']
        let sal = 0
        let efec = 0
        let pay = 0
        for (let i = 0; i < result.length; i++) {
          fechas.push(result[i]._id.fecha)
          // fechas.push(moment(result[i]._id.fecha).format('MMMM'))
            // sal = 0
            // efec = 0
            // pay = 0
          for (let e = 0; e < result[i].conceptos.length; e++) {
            if(result[i].conceptos[e].concepto.toString() == '5c93a9500368c807786a9f39') {
              sal += result[i].conceptos[e].total
            }else if(result[i].conceptos[e].concepto.toString() == '5c93a9570368c807786a9f3a') {
              efec += result[i].conceptos[e].total
            }else if(result[i].conceptos[e].concepto.toString() == '5c93fec644962a0d7ab3ea36') {
              pay += result[i].conceptos[e].total
            }
          }

        }

        let series = []
        paypal = Math.round(pay)
        efectivo = Math.round(efec)
        saldo = Math.round(sal)
        series.push(paypal, efectivo, saldo)
        res.status(200).json({fechas, series, pieoptions})
        
    });
    } catch (error) {
      handleError(error, res)
    }
  })
  app.get('/graficas/comision/mes', Auth.isAuth, Auth.permisos(['Dashboard'],'Ver'), async (req, res) => {
    let dias = req.query.dias
      let cantidad = req.query.cantidad
      var desde = req.query.desde
      var hasta = req.query.hasta
      // if(dias) {
      //   desde = moment().subtract(dias, 'days').format("YYYY-MM-DDTHH:mm");
      // }else{
      //   desde = moment().subtract(1, 'year').format("YYYY-MM-DDTHH:mm");
      // }
      if(desde && hasta) {
        hasta = moment(hasta).format("YYYY-MM-DD")
        desde =  moment(desde).format("YYYY-MM-DDTHH:mm")
        hasta = moment(hasta).add(24, 'hours');
      }else{
        let year = moment().format("YYYY")
        hasta = moment().format("YYYY-MM-DDTHH:mm")
        desde = year + '-01-01'
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
              format: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" }},
              total : 1,
              haber: 1,
              concepto: 1
            }
        },
        {
          $group: { _id: { 'fecha' : '$formato'}, format:{ $addToSet: '$format'}, conceptos: { $push: {concepto: "$concepto", total: '$total'}}}
        },
        {
          $sort : { format : 1 }
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
              pay += result[i].conceptos[e].total
            }
          }
          
          let payp = pay.toFixed(0)
          paypal.data.push(payp)
        }
        // console.log(saldo.data)
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
      // console.log('desde')
      // console.log(desde)
      // console.log('hasta')
      // console.log(hasta)
      // console.log('id: ' + id.sub)
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
                    'concepto' : {$eq: ObjectId('5c98f54f6cdf8b0601ea7d5e')}
                  },
                  {
                    'concepto' : {$eq: ObjectId('5d66958efc0df8087a508174')}
                  },
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
          $group: { _id: { 'concepto' : '$formato'}, haber: { $push: {state: "$haber"}}}
        },
        {
          $sort : { formato : 1 }
        }

    ], function (err, result) {
      //5c98f581c7e56806017641de == Comision por pago de viaje con PayPal
      //5c93a95f0368c807786a9f3b == Abono al chofer por viaje realizado
      // console.log(result)  
      let fechas = []
        let transacciones = []
        let total = 0
        let data = []
        let fech = []
        for (let j = 0; j < 4; j++) {
          fech.push(moment(fecha).subtract(j, 'days').format("YYYY-MM-DD"))
        }
        // console.log(fech)
        for (let i = 0; i < result.length; i++) {
          //console.log(i)
          //console.log(moment(fecha).subtract(i, 'days').format("YYYY-MM-DD"))
          fechas.push(result[i]._id.concepto)
          for (let e = 0; e < result[i].haber.length; e++) {
            transacciones.push(result[i].haber[e].state)
            total += result[i].haber[e].state
          }
          let index = fech.indexOf(result[i]._id.concepto)
          if(index > -1) {
            fech.splice(index, 1)
          }
          data.push({fecha: result[i]._id.concepto, transacciones: transacciones, total: total})
          transacciones= []
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
          // console.log(data[y])
          data[y].fecha = moment(data[y].fecha).format("DD-MM")
        }
        // console.log(data)
        res.status(200).json({data: data})
        //return {paypal, efectivo, saldo, total, comision}
    });
    } catch (error) {
      handleError(error, res)
    }
  })
  app.get('/resumen/retiros', Auth.isAuth, Auth.permisos(['Balance'],'Ver'), async (req, res) => {
    let dias = req.query.dias
      let cantidad = req.query.cantidad
      var desde = req.query.desde
      var hasta = req.query.hasta
      // if(dias) {
      //   desde = moment().subtract(dias, 'days').format("YYYY-MM-DDTHH:mm");
      // }else{
      //   desde = moment().subtract(1, 'year').format("YYYY-MM-DDTHH:mm");
      // }
      if(desde && hasta) {
        hasta = moment(hasta).format("YYYY-MM-DD")
        desde =  moment(desde).format("YYYY-MM-DDTHH:mm")
        hasta = moment(hasta).add(24, 'hours');
      }else{
        let year = moment().format("YYYY")
        hasta = moment().format("YYYY-MM-DDTHH:mm")
        desde = year + '-01-01'
      }
      if(!cantidad) {
        cantidad = 10
      }
      // console.log('hasta')
      // console.log(hasta)
    try {
      Retiros.aggregate([
        {
          $match:
          {    
            $and:
            [
              {
                'fecha': { $gte: new Date(desde), $lte: new Date(hasta)}   
              }
            ]    
          }
        },
        {
          $project:
            {
              formato: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" }},
              monto : 1,
              tipo: 1,
              estatus: 1
            }
        }
    ], function (err, result) {
        let countapro = 0
        let countrech = 0
        let countpend = 0
        let apro = 0
        let recha = 0
        let pend = 0
        for (let i = 0; i < result.length; i++) {
          if(result[i].estatus === 'Pendiente') {
            pend = pend + result[i].monto
            countpend ++
          }else if(result[i].estatus === 'Aceptado') {
            apro = apro + result[i].monto
            countapro ++
          }else if(result[i].estatus === 'Rechazado') {
            recha = recha + result[i].monto
            countrech ++
          }
        }
        let pendientes = Math.round(pend).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
        let aprobadas = Math.round(apro).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
        let rechazadas = Math.round(recha).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
        let tot = apro + recha + pend
        let total = Math.round(tot).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
        let totalcount = countpend + countapro + countrech
        res.status(200).json({total, aprobadas ,rechazadas, pendientes, countpend, countapro, countrech, totalcount})
    });
    } catch (error) {
      handleError(error, res)
    }
  })
  app.get('/resumen/pagos', Auth.isAuth, Auth.permisos(['Dashboard'],'Ver'), async (req, res) => {
    let dias = req.query.dias
      let cantidad = req.query.cantidad
      var desde = req.query.desde
      var hasta = req.query.hasta
      // if(dias) {
      //   desde = moment().subtract(dias, 'days').format("YYYY-MM-DDTHH:mm");
      // }else{
      //   desde = moment().subtract(7, 'days').format("YYYY-MM-DDTHH:mm");
      // }
      // console.log(desde+' '+hasta)
      if(desde && hasta) {
        hasta = moment(hasta).format("YYYY-MM-DD")
        desde =  moment(desde).format("YYYY-MM-DDTHH:mm")
        hasta = moment(hasta).add(24, 'hours');
      }else{
        let year = moment().format("YYYY")
        hasta = moment().format("YYYY-MM-DDTHH:mm")
        desde = year + '-01-01'
      }
      if(!cantidad) {
        cantidad = 10
      }
      // console.log('hasta')
      // console.log(hasta)
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
              concepto: 1,
            }
        },
        {
          $group: { _id: { 'concepto' : '$concepto'}, total: { $sum: '$total'}}
        }

    ], function (err, result) {
      // console.log(result)
        let pay = 0
        let efec = 0
        let sal = 0
        let com = 0
        for (let i = 0; i < result.length; i++) {
          if(result[i]._id.concepto.toString() === '5c93fec644962a0d7ab3ea36') {
            pay = result[i].total
          }else if(result[i]._id.concepto.toString() === '5c93a9500368c807786a9f39') {
            sal = result[i].total
          }else if(result[i]._id.concepto.toString() === '5c93a9570368c807786a9f3a') {
            efec = result[i].total
          }else if(result[i]._id.concepto.toString() === '5c93a9660368c807786a9f3c') {
            com = result[i].total
          }
        }
        let tot = pay + sal + efec
        let total = tot.toFixed(2).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
        let comision = com.toFixed(2).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
        let paypal = pay.toFixed(2).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
        let efectivo = efec.toFixed(2).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
        let saldo = sal.toFixed(2).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
        res.status(200).json({paypal, efectivo, saldo, total, comision})
        //return {paypal, efectivo, saldo, total, comision}
    });
    } catch (error) {
      handleError(error, res)
    }
  })
  app.get('/viajes/mes', Auth.isAuth, Auth.permisos(['Reporte de Pagos'],'Ver'), async (req, res) => {
    let dias = req.query.dias
      let cantidad = req.query.cantidad
      var desde = req.query.desde
      var hasta = req.query.hasta
      // if(dias) {
      //   desde = moment().subtract(dias, 'days').format("YYYY-MM-DDTHH:mm");
      // }else{
      //   desde = moment().subtract(1, 'year').format("YYYY-MM-DDTHH:mm");
      // }
      if(desde && hasta) {
        hasta = moment(hasta).format("YYYY-MM-DD")
        desde =  moment(desde).format("YYYY-MM-DDTHH:mm")
        hasta = moment(hasta).add(24, 'hours');
      }else{
        let year = moment().format("YYYY")
        hasta = moment().format("YYYY-MM-DDTHH:mm")
        desde = year + '-01-01'
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
                total ++
                if(result[i].status[e].costo) {
                  // console.log(result[i].status[e].costo)
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
  app.get('/nuevos/usuarios', Auth.isAuth, Auth.permisos(['Dashboard'],'Ver'), async (req, res) => {
    let dias = req.query.dias
      let cantidad = req.query.cantidad
      var desde = req.query.desde
      var hasta = req.query.hasta
      if(desde && hasta) {
        hasta = moment(hasta).format("YYYY-MM-DD")
        desde =  moment(desde).format("YYYY-MM-DDTHH:mm")
        hasta = moment(hasta).add(24, 'hours');
      }else{
        let year = moment().format("YYYY")
        hasta = moment().format("YYYY-MM-DDTHH:mm")
        desde = year + '-01-01'
      }
      if(!cantidad) {
        cantidad = 10
      }
    try {
      Chofer.aggregate([
        {
          $match:
          {    
            'createdAt': { $gte: new Date(desde), $lte: new Date(hasta)}       
          }
        },
        {
          $project:
            {
              formato: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }},
            }
        },
        {
            $group: { _id: { 'fecha' : '$formato'}, count: { $sum: 1} }
        },
        { $sort : { _id : 1 } }
    ], function (err, result) {
        if (err) {
           console.log(err)
        } else {
          let acum = 0
          for (let i = 0; i < result.length; i++) {
            acum = acum + result[i].count
          }
          res.status(200).json({usuarios: acum})
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
      // if(dias) {
      //   desde = moment().subtract(dias, 'days').format("YYYY-MM-DDTHH:mm");
      // }else{
      //   desde = moment().subtract(7, 'days').format("YYYY-MM-DDTHH:mm");
      // }
      if(desde && hasta) {
        hasta = moment(hasta).format("YYYY-MM-DD")
        desde =  moment(desde).format("YYYY-MM-DDTHH:mm")
        hasta = moment(hasta).add(24, 'hours');
      }else{
        hasta = moment().format("YYYY-MM-DDTHH:mm")
        desde = moment().subtract(7, 'days').format("YYYY-MM-DDTHH:mm");
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
  app.get('/viajes', Auth.isAuth,  Auth.permisos(['Dashboard', 'Reporte de Pagos'],'Ver'), async (req, res) => {
    let dias = req.query.dias
      let cantidad = req.query.cantidad
      var desde = req.query.desde
      var hasta = req.query.hasta
      // if(dias) {
      //   desde = moment().subtract(dias, 'days').format("YYYY-MM-DDTHH:mm");
      // }else{
      //   desde = moment().subtract(7, 'days').format("YYYY-MM-DDTHH:mm");
      // }
      if(desde && hasta) {
        hasta = moment(hasta).format("YYYY-MM-DD")
        desde =  moment(desde).format("YYYY-MM-DDTHH:mm")
        hasta = moment(hasta).add(24, 'hours');
      }else{
        let year = moment().format("YYYY")
        hasta = moment().format("YYYY-MM-DDTHH:mm")
        desde = year + '-01-01'
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
              format: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" }},
              estatus : 1
            }
        },
        {
            $group: { _id: { 'fecha' : '$formato'} ,format:{ $addToSet: '$format'}, status: { $push: {state: "$estatus"}}, count: {$sum: 1}}
        },
        { $sort : { format : 1 } }
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
            // console.log(result[i].count)
            fechas.push(moment(result[i]._id.fecha).format('MMMM'))
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
            // console.log(total)
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