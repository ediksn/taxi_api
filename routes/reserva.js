'use strict'

import express from 'express'
import { Reserva, Chofer,  Cliente, Trans, Vehiculo, Notificaciones, Settings, Email, Consulta } from '../api'
import { handleError, server } from '../Utils'
import { Login, Busqueda, Firebase,StaticMap } from '../services'
import { Auth } from '../middleware'
import io from 'socket.io-client';
import { db } from '../config'
import moment from 'moment';
import busqueda from '../services/busqueda';
const schedule = require('node-schedule')
const geolib = require('geolib')
const socket = io(server);
  
  const app = express.Router()
  
  app.get('/', Auth.isUsuario, async (req, res) => {
    try {
      const data = await Reserva.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ninguna reserva'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })
  app.post('/prueban', async (req, res) => {
    let settings = await Settings.find()
    try {
      let data=await Busqueda.prueban(req.body.distancia, req.body.vehiculo, req.body.ida_vuelta)
      // console.log(data)
      res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin', Auth.isUsuario, Auth.permisos(['Reporte de Reservas'],'Ver'), async (req, res) => {
    try {
      const data = await Reserva.find()
      if(data.length==0){
        res.status(404).json({message:'No existe ninguna reserva'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin/comen', Auth.isUsuario, Auth.permisos(['Reporte de Reservas'],'Ver'), async (req, res) => {
    try {
      const data = await Reserva.findFin()
      if(data.length==0){
        res.status(404).json({message:'No existe ninguna reserva'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/admin/seguimiento', Auth.isUsuario, Auth.permisos(['Seguimiento'],'Ver'), async (req, res) => {
    try {
      const data = await Reserva.findHoy()
      if(data.length==0){
        res.status(404).json({message:'No existe ninguna reserva'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/fechas/:x/:y', Auth.isUsuario, Auth.permisos(['Reporte de Reservas'],'Ver'), async (req, res) => {
    try {
      const data = await Reserva.findFechas(req.params.x,req.params.y)
      if(data.length==0){
        res.status(404).json({message:'No existe ninguna reserva'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })
  
  app.get('/fechas2/:x/:y', Auth.isUsuario, Auth.permisos(['Reporte de Reservas'],'Ver'), async (req, res) => {
    try {
      const data = await Reserva.findFechas2(req.params.x,req.params.y)
      if(data.length==0){
        res.status(404).json({message:'No existe ninguna reserva'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/fecha_fin/:x/:y', Auth.isUsuario, Auth.permisos(['Reporte de Reservas'],'Ver'), async (req, res) => {
    try {
      const data = await Reserva.findFechasFin(req.params.x,req.params.y)
      if(data.length==0){
        res.status(404).json({message:'No existe ninguna reserva'})
      }
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })
  
  app.get('/driver', Auth.isChofer, async (req, res) => {
      let id= await Login.decodeTok(req.headers.authorization.split(' ')[1])
    try {
      const data = await Reserva.findByDriver(id.sub)
      if(data.length==0)
        res.status(404).json({message:`No existen reservas para el chofer con id ${id.sub}`})
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })  

  app.get('/client', Auth.isCliente, async (req, res) => {
      let id= await Login.decodeTok(req.headers.authorization.split(' ')[1])
    try {
      const data = await Reserva.findByClient(id.sub)
      if(data.length==0)
        res.status(404).json({message:`No existen reservas para el cliente con id ${id.sub}`})
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/:id', Auth.isAuth, async (req, res) => {
    //console.log('ppor aqui')
    try {
      const data = await Reserva.findById(req.params.id)
      if(!data)
        res.status(404).json({message:`No existe la reserva con el id ${req.params.id}`})
      else
        res.status(200).json(data)
    } catch (error) {
      handleError(error, res)
    }
  })

  app.get('/llegado/:id', Auth.isAuth, async (req, res) => {
    let reser = await Reserva.findById(req.params.id)
    let settings = await Settings.find()
    try {
      reser.inicio = moment()
      reser.limite = moment(reser.inicio).add(settings.tiempo_esp,'s')
      reser.horaLlegado = Date.now()
      await Reserva.update(reser)
      var ref = db.ref("reserva/" + req.params.id + '/horaLlegado');
      ref.set(moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'));
      var ref = db.ref("reserva/" + req.params.id + '/estatus');
      ref.set('Llegado');
      if(reser.user.fcmtoken){
        Notificaciones.enviar(reser.user.fcmtoken, 'Su chofer ha llegado', 'El el chofer ha llegado al punto de encuentro',null,'llega')
      }
      socket.emit('llegado',{message:'El chofer ha llegado al punto de encuentro', id:reser.user._id} )
      res.status(200).json({status:'Succes', message:'El chofer ha llegado al punto de encuentro'})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.post('/prueba',async (req,res)=>{
    let set = await Settings.find()
    let int =[]
    if(req.body.vehiculo==='Taxi'){
      int=set.intervalo
    }else{
      int=set.intervalo_m
    }
    int = int.filter(el=>{
      if(el.dist_max){
          return el.dist_min<=parseFloat(req.body.distancia)&&el.dist_max>=parseFloat(req.body.distancia)
      }else{
          return el.dist_min<=parseFloat(req.body.distancia)
      }
    })
    // let data = await Busqueda.prueba(req.body.puntos)
    // let data = await Busqueda.prueba(req.body.origen,req.body.destino)
    res.status(200).json({message:int})
  })

  app.post('/consulta', async (req,res)=>{
    try {
      let data = await Busqueda.calculos(req.body.origen,req.body.destino,req.body.vehiculo,req.body.ida_vuelta)
      await Consulta.create({recibidos:req.body, enviados:data, user: req.body.user})
      res.status(200).json({ status:data?'Succes':'denied',data: data})
    } catch (error) {
      res.status(200).json({ status:'error',data: error})
    }
  })

  app.post('/', Auth.isCliente, async (req, res) => {
    try {
      let id= await Login.decodeTok(req.headers.authorization.split(' ')[1])
      let q = req.body
      // console.log("--------------------------")
      // console.log(id)
      // console.log("--------------------------")
      if(id.rol==='Cliente'){ 
        q.user = id.sub
        if(q.user_name) delete q.user_name
        if(q.user_lastname) delete q.user_lastname
        if(q.user_tlf) delete q.user_tlf
      }
      else{
        delete q.user.imagen
      } 
      q.estatus='Pendiente'
      let consul=await Busqueda.calculos(req.body.origen, req.body.destino, req.body.vehiculo,req.body.ida_vuelta )
      q.costo = consul.costo
      q.distancia = consul.distancia
      q.duration = consul.duration
      q.pasos = consul.pasos
      if(consul.pasos_vuelta)
      {
        q.pasos_vuelta=consul.pasos_vuelta  
      }
      const sec = await Reserva.findId()
      // console.log(sec)
      if (sec === null||sec.length<1) {
        q.id_num = 1
      } else {
        q.id_num = (sec[0].id_num + 1)
      }
      const data = await Reserva.create(q)
      if(!q.booking){
        Busqueda.findChoferes(data._id, [])
      }
      else{
        let date = moment(q.booking).add(4,'h').format('YYYY-MM-DDTHH:mm:ss.000Z')
        date = new Date(date)
        // console.log(date)
        // console.log(new Date)
        // console.log(date.toTimeString())
        try {
          let agenda = schedule.scheduleJob(date,function(){
            Busqueda.findChoferes(data._id, [])
          })
        } catch (error) {
          console.log(error)
        }
      }
      socket.emit('actualizar_reserv',{message:'Actualizacion de reserva'})
      socket.emit('actualizar_reserv2',{message:'Actualizacion de reserva'})
      res.status(201).json({message:'Reserva creada exitosamente',data})
    } catch (error) {
      handleError(error, res)
    }
  })

  app.put('/valoracion', Auth.isAuth, async(req, res)=>{
    try {
      //console.log('se ejecuta valoracion')
      //console.log(req.body)

      let reser = await Reserva.findById(req.body._id)
      let chof = await Chofer.findById(reser.driver._id)
      
      if(req.body.val_dri) {
      }else if(req.body.val_cli) {
        //console.log('se ejecuta else if')
        //console.log(chof.valor)
        if(chof.valor) {
          chof.valor += req.body.val_cli
          chof.viajes++
        }else{
          chof.valor = req.body.val_cli
          chof.viajes = 1
        }
        await Chofer.update(chof)
      }
      var ref = db.ref("chofer/" + reser.driver._id + '/reserva').set(null);
      const data = await Reserva.update(req.body)
      res.status(200).json({status:'Succes',message:'Reserva valorada' })
    } catch (error) {
      res.status(500).json({status:'Denied', message:error})
    }
  })

  app.put('/fav', Auth.isCliente, async(req, res)=>{
    try {
      const data = await Reserva.update(req.body)
      res.status(200).json({status:'Succes',data:data })
    } catch (error) {º
      res.status(500).json({status:'Denied', message:error})
    }
  })

  app.put('/recorrido', Auth.isAuth, async(req, res)=>{
    let reser = await Reserva.findById(req.body._id)
    if(!reser.puntos){
      reser.puntos=[]
    }
    reser.puntos.push(req.body.puntos)
    try {
      const data = await Reserva.update(reser)
      res.status(200).json({status:'Succes',data:data })
    } catch (error) {
      res.status(500).json({status:'Denied', message:error})
    }
  })

  app.put('/', Auth.isAuth, async (req, res) => {
    try {
      let id= await Login.decodeTok(req.headers.authorization.split(' ')[1])
      let q = req.body
      let data
      let arr
      let chof
      let ql = await Reserva.findById(q._id)
      // Actualizar Base de datos Firebase
      //console.log(q._id)
      // console.log(q.estatus)
      var ref = db.ref("reserva/" + q._id + '/estatus');
      if(q.estatus!=='Terminado'){
        ref.set(q.estatus);
      }
      
      // ------------Fin-------------------
      //console.log(q._id)
      // console.log(q.estatus)
      switch(q.estatus){
        case 'Iniciado':
          if(id.rol==='Cliente'){
            arr={
              user:id.sub,
              driver: ql.driver._id
            }
            Notificaciones.enviar(ql.driver.fcmtoken, 'Viaje Iniciado', 'El Cliente ha indicado que el viaje a iniciado', arr, 'iniciado')
          }
          else{
            arr ={
              user: ql.user._id,
              driver: id.sub
            }
            if(ql.user.fcmtoken){
              Notificaciones.enviar(ql.user.fcmtoken, 'Viaje Iniciado', 'El Chofer ha indicado que el viaje a iniciado', arr, 'iniciado') 
            }
          }
          socket.emit('iniciado', arr)
          q.horaIni = Date.now()
          q.estatus = 'Iniciado'
          var ref = db.ref("reserva/" + q._id + '/horaIni');
          ref.set(q.horaIni);
      // ------------Fin-------------------
          data = await Reserva.update(q)
          res.status(200).json({message: `Se ha comenzado el viaje por el chofer ${arr.driver} para el cliente ${arr.user}`, data})
          break;
        case 'Terminado':
          try{
            arr ={
              user: ql.user._id,
              driver: id.rol==='Chofer'?id.sub:ql.driver._id
            }
            var ref = db.ref("reserva/"+q._id)
            let set = await Settings.find()
            await Chofer.update({_id:arr.driver,estatus:'Disponible'})
            socket.emit('actualizar_reserv',{message:'Actualizacion de chofer'})
            socket.emit('actualizar_reserv2',{message:'Actualizacion de reserva'})
            q.estatus='Terminado'
            q.horaTerm=moment()
            let inicial = moment(ql.horaIni)
            let llegado = moment(ql.horaLlegado)
            ql.horaIni=moment(ql.horaIni)
            let tiempo = Math.round(q.horaTerm.diff(moment(ql.horaIni), 'minutes', true))
            let espera = Math.round(inicial.diff(llegado,'minutes', true))
            ql.costo_extra_tiempo = 0
            ql.costo_tiempo_espera = 0
            ql.duracion_ext=0
            if(ql.puntos&&ql.puntos.length>1&&geolib.getPathLength(ql.puntos)>100){
              let datos = await Busqueda.calculos(ql.origen, ql.puntos[ql.puntos.length-1],ql.vehiculo,ql.ida_vuelta,ql.puntos)
              ql.distancia = (q.distancia = datos.distancia)
              ql.llegada=(q.llegada=datos.llegada)
              ql.costo=(q.costo = datos.costo)
              ql.duracion = (q.duracion = tiempo)
              ql.duracion_ext = tiempo-ql.tiempo
              if(ql.duracion_ext>0){
                ql.costo_extra_tiempo= ql.duracion_ext*set.tarifa_ext
                //q.total = q.costo+costo_ext_tiempo+(q.costo+costo_ext_tiempo*(set.iva / 100))
                q.duracion_ext = ql.duracion_ext
                q.costo_extra_tiempo = ql.costo_extra_tiempo
              }
              if(espera=>set.espera_max){
                ql.costo_tiempo_espera=espera*set.cost_espera
                q.costo_tiempo_espera= ql.costo_tiempo_espera
                ql.tiempo_espera = (q.tiempo_esp=espera)
              }
            }else{
              let int =[]
              if(ql.vehiculo==='Taxi'){
                int=set.intervalo
              }else{
                int=set.intervalo_m
              }
              int=int.filter(el=>{
                return el.dist_min===0 
              })
              ql.distancia=(q.distancia='0 km')
              ql.llegada=(q.llegada=ql.salida)
              ql.costo=(q.costo = int[0].tarifa_base)
              ql.duracion = (q.duracion = 0)
            }
            ql.total = (q.total = (ql.costo_extra_tiempo + ql.costo + ql.costo_tiempo_espera))
            let imagen =StaticMap.create(ql.puntos&&ql.puntos.length>1&&geolib.getPathLength(ql.puntos)>100?ql.puntos:[ql.origen,ql.origen])
            if(!ql.user_name){
              Email.enviaremail(ql.user.email,'Viaje finalizado','finalizado',{
                nombre:ql.user.nombre,
                total:ql.total.toFixed(2),
                duracion:ql.duracion,
                distancia:ql.distancia,
                costo:ql.costo,
                tiempo_extra:ql.costo_extra_tiempo,
                tiempo_espera:ql.costo_tiempo_espera,
                salida:ql.salida,
                llegada:ql.llegada,
                imagen:imagen,
                tipo: ql.tipo
              })
            }
            await ref.child('llegada').set(ql.llegada)
            await ref.child('horaTerm').set(new Date(q.horaTerm))
            await ref.child('duracion').set(q.duracion)
            await ref.child('distancia').set(q.distancia)
            await ref.child('duracion_ext').set(ql.duracion_ext)
            await ref.child('costo_extra_tiempo').set(ql.costo_extra_tiempo)
            await ref.child('costo_tiempo_espera').set(ql.costo_tiempo_espera)
            await ref.child('costo').set(q.costo)
            await ref.child('total').set(q.total)
            await ref.child('estatus').set(q.estatus)
            if(ql.tipo){ await ref.child('tipo').set(ql.tipo)}
            data = await Reserva.update(q)
            socket.emit('terminado', ql)
            if(ql.user.fcmtoken){
              Notificaciones.enviar(ql.user.fcmtoken, 'Viaje Terminado', 'El Chofer ha indicado que el viaje a Finalizado', ql._id, 'terminado')
            }
            Notificaciones.enviar(ql.driver.fcmtoken, 'Viaje Terminado', 'El Cliente ha indicado que el viaje a Finalizado', '', 'terminado')
            res.status(200).json({message: id.rol==='Usuario'?`Viaje finalizado`:`Viaje finalizado por el chofer ${arr.driver} para el cliente ${arr.user}`, data})
          } catch (error) {
            handleError(error)
          } 
          break;
        case 'Cancelada':
          var ref = db.ref("reserva/"+q._id)
          arr = {
            user: ql.user,
            reserva: q._id,
            chofer:id.rol==='Chofer'?id.sub:ql.driver._id
          }
          await Chofer.update({_id:arr.chofer,estatus:'Disponible'})
          socket.emit('actualizar_reserv',{message:'Actualizacion de chofer'})
          socket.emit('actualizar_reserv2',{message:'Actualizacion de reserva'})
          socket.emit('cancelado', arr)
          q.horaCancel= Date.now()
          q.estatus='Cancelada'
          data = await Reserva.update(q)
          var ref = db.ref("chofer/" + arr.chofer + '/reserva').set(null);
          res.status(200).json({message: id.rol==='Chofer'?`Reserva ${q._id} cancelada por el chofer ${id.sub}`:'Viaje cancelado', data})
          if(id.rol==='Chofer'){
            Notificaciones.enviar(ql.user.fcmtoken, 'Viaje Cancelado', 'El Chofer ha cancelado el viaje', '', 'cancelado')
          }
          //Busqueda.findChoferes(q._id, [id.sub])
          break;
        case 'Abortada':
          try {
            
            if(ql.driver){
              arr = {
                user: id.sub,
                reserva: q._id,
                chofer: id.rol==='Chofer'?id.sub:ql.driver
              }
              socket.emit('abort', arr)
              // console.log(arr)
              var ref = db.ref("chofer/" + arr.chofer._id + '/reserva').set(null);
              Notificaciones.enviar(ql.driver.fcmtoken, 'Viaje Cancelado', 'El Cliente ha cancelado el viaje', '', 'abort')
            }
            await Chofer.update({_id:ql.driver?arr.chofer:ql.chofer_temporal,estatus:'Disponible'})
            socket.emit('actualizar_reserv',{message:'Actualizacion de chofer'})
            socket.emit('actualizar_reserv2',{message:'Actualizacion de reserva'})
            q.horaAbor = Date.now()
            if(id.rol != 'Usuario') {
              q.user=id.sub
            }
            q.chofer_temporal=null
            data = await Reserva.update(q)
            res.status(200).json({message: `Reserva ${q._id} cancelada por el cliente ${id.sub}`, data})
          } catch (error) {
            console.log(error)
          }
          break;
        case 'Aceptada':
          if(ql.estatus==='Pendiente'){
            q.horaAcep = Date.now()
            q.driver=id.sub
            data = await Reserva.update(q)
            chof = await Chofer.findById(id.sub)
            let usr = await Cliente.findById(ql.user)
            let veh = await Vehiculo.findByOwner(id.sub)
            arr = {
              user: ql.user,
              reserva: ql,
              chofer: chof,
              veh: veh
            }
            chof.estatus='Viajando',
            await Chofer.update(chof)
            Firebase.updateReservaChofer(chof, q._id, q.driver)
            // console.log('//////////////////////////////')
            // console.log(JSON.stringify(arr))
            // console.log('//////////////////////////////')
            socket.emit('actualizar_reserv',{message:'Actualizacion de chofer'})
            socket.emit('actualizar_reserv2',{message:'Actualizacion de reserva'})
            socket.emit('aceptar', arr)
            Notificaciones.enviar(ql.user.fcmtoken, 'Viaje Aceptado', 'Hemos encontrado un chofer para tu viaje', ql._id, 'aceptar')
            res.status(200).json({message: `Reserva ${q._id} aceptada por el chofer ${id.sub}`, usr})
          }
          else{
            chof = await Chofer.findById(id.sub)
            chof.estatus='Disponible'
            await Chofer.update(chof)
            socket.emit('vencida', id.sub)
            Notificaciones.enviar(chof.fcmtoken, 'Viaje no disponible', 'Este viaje ya no se encuentra disponible', id.sub, 'vencida')
            res.status(200).json({status:'denied',message: `Este viaje ya no se encuentra disponible`})
          }
          break;
        default:
          res.status(500).json({message:'Estatus invalido'}) 
          break;
      }
    } catch (error) {
      handleError(error, res)
    }
  })
  
  export default app