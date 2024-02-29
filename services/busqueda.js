'use strict'

import {Chofer, Reserva, Vehiculo, Cliente, Geocerca, Ruta} from '../models'
import { Busqueda, Firebase } from './index'
import { Notificaciones } from '../api'
import { Utils} from '../Utils/index'
import io from 'socket.io-client';
import {server} from '../Utils'
const socket = io(server);
const request = require('request')
import { Settings } from '../api'
const rp = require('request-promise')
import geolib from 'geolib'
const errorMessage = Utils
import moment from 'moment'
import 'moment/locale/es'
moment.locale('es')
import { db } from '../config'
import chofer from '../api/chofer';

export default {
    prueba: () => {
        var ref = db.ref("users/" + 1233456789);
        ref.set({
            nombre: 'luis',
            apellido: 'man 2'
        });
    },

    async prueban(distancia,vehiculo, ida_vuelta){
        let int
        let settings = await Settings.find()
        if(vehiculo==='Taxi'){
            int = settings.intervalo
        }
        else{
            int = settings.intervalo_m
        }
        // console.log(distancia)
        int = int.filter(el=>{
            if(el.dist_max){
                return el.dist_min<=distancia&&el.dist_max>=distancia
            }else{
                return el.dist_min<=distancia
            }
        })
        int=int[0]
        if(int.tarifa_base&&int.tarifa_base!==null&&int.tarifa_base>0&&(!int.tarif_km||int.tarif_km===null||int.tarif_km===0)){
            return ida_vuelta?int.tarifa_base+(int.tarifa_base*(settings.ida_vuelta / 100)):int.tarifa_base
        }
        else if((!int.tarifa_base||int.tarifa_base===null||int.tarifa_base===0)&&int.tarif_km&&int.tarif_km>0&&int.tarif_km!==null){
            return ida_vuelta? int.tarif_km*distancia+(int.tarif_km*distancia*(settings.ida_vuelta / 100)) : int.tarif_km*distancia
        }
        else{
            precio = (int.tarif_km*distancia)+int.tarifa_base
            return ida_vuelta?precio+(precio*(settings.ida_vuelta / 100)): precio
        }
        // let datos = await Intervalos.findOne({dist_min:{$lte:JSON.parse(distancia)},$and:[{dist_max:{$gte:JSON.parse(distancia)}},{dist_max:{$exists:true}}]})
        // if(!datos){
        //     datos= await Intervalos.findOne({dist_min:{$lte:JSON.parse(distancia)},dist_max:{$exists:false}})
        // }
        // let datos = geolib.getPathLength(puntos)
        //let datos = await Busqueda.calculos(origen,destino)
        return int
    },

    async findChoferes(reserva, negados){
        let settings = await Settings.find()
        let distance
        let reser = await Reserva.findById(reserva).populate('user')
        try {
            await Firebase.createReserva(reser)
        } catch (error) {
            console.log(error)
        }
        // // Actualizar Base de datos Firebase
        var ref = db.ref("reserva/" + reser._id);
        let user = reser.user._id
        // // ------------Fin-------------------
        if(reser.estatus==='Pendiente'){
            let neg = reser.negados
            reser.negados=negados
            let choferes
            let resp = await Busqueda.ubicar(reser.origen)
            if(resp!==false&&resp.choferes.length>0){
                choferes = await Chofer.findOne({ 
                    $and: [{
                        estatus: 'Disponible',
                        _id :{$nin : neg},
                        _id:{$in:resp.choferes},
                        vehiculo:{$exists:true},
                        updatedAt:{$gte:new Date(new Date().setMinutes(new Date().getMinutes()-5))}
                    }]
                })
                .populate('vehiculo')
            }
            else{
                // console.log(settings.perim_busq)
                distance = settings.perim_busq / 6371000
                console.log(distance)
                choferes = await Chofer.findOne({
                     $and: [{
                        estatus: 'Disponible',
                        _id :{$nin : neg}, 
                        vehiculo:{$exists:true},
                        'map':{ 
                            // $within: { 
                            //     $centerSphere: [
                            //         [ reser.origen.lat, reser.origen.lng], 
                            //         distance
                            //     ]
                            // }
                            $nearSphere:[reser.origen.lat, reser.origen.lng],
                            $maxDistance: distance
                        },
                        updatedAt:{$gte:new Date(new Date().setMinutes(new Date().getMinutes()-5))}
                    }]
                })
                .populate('vehiculo')
            }
            if(choferes&&choferes.vehiculo.tipo===reser.vehiculo){
                let car = true
                if(reser.extras && reser.extras.length>0){
                    let carro = await Vehiculo.findOne({$and:[{owner:choferes._id, extras:{$all:reser.extras}}]})
                    carro===null?car=false:car=true
                    // console.log(carro)
                }
                // console.log(car)
                if(car===true){
                    let info = await Busqueda.calculos(reser.origen, reser.destino,reser.vehiculo,reser.ida_vuelta, reser.puntos)
                    let arr = {
                        chofer: choferes._id,
                        reserva: reser,
                        distancia: info.distancia,
                        tiempo: info.tiempo,
                        origen: reser.origen,
                        destino: reser.destino,
                        costo: info.costo,
                    }
                    if(reser.ida_vuelta){
                        arr.pasos_vuelta=info.pasos_vuelta
                    }
                    let geo = await Busqueda.geocode(reser.origen)
                    await Reserva.update({_id:reserva},{$set:{
                        distancia:arr.distancia,
                        tiempo:arr.tiempo,
                        polyline:info.polyline,
                        costo:info.costo,
                        ciudad: geo.ciudad,
                        estado: geo.estado,
                        llegada:info.llegada,
                        salida:info.salida
                    }})
                    arr.inicio=moment()
                    arr.limite=moment(arr.inicio).add(settings.tiempo_esp,'seconds')
                    await Chofer.update({_id:choferes._id},{$set:{estatus:'Espera'}})
                    await Reserva.update({_id:reserva},{$set:{chofer_temporal:choferes._id}})
                    // Actualizar Base de datos Firebase chofer
                    var ref = db.ref("chofer/" + arr.chofer + '/reserva');
                    var ref2 = db.ref('reserva/'+reser._id+'/limite')
                    
                    try {
                        await ref2.set(arr.limite.toString())
                        await ref.set(reser._id.toString())
                    } catch (error) {
                        console.log(error)
                    }
                    socket.emit('aviso', arr)
                    socket.emit('actualizar_reserv',{message:'Actualizacion de chofer'})
                    // ------------Fin-------------------
                    Notificaciones.enviar(choferes.fcmtoken, 'Solicitud de Viaje', 'Tienes una solicitud de viaje nueva', {reser:reser._id, limite:arr.limite}, 'viaje')
                    await setTimeout(async () => {
                        let data = await Reserva.findById(reserva)
                        // console.log('entra en el settimeout')
                        reser=data
                        if(reser.estatus==='Pendiente') {
                            neg.push(choferes._id.toString())
                            // Actualizar Base de datos Firebase chofer
                            var ref = db.ref("chofer/" + choferes._id.toString()+ '/reserva');
                            ref.set(null);
                            // ------------Fin-------------------
                            await Reserva.update({ _id: reserva }, { $set: {negados: neg,chofer_temporal:null} })
                            await Chofer.update({_id:choferes._id},{$set:{estatus:'Disponible'}})
                            socket.emit('actualizar_reserv',{message:'Actualizacion de chofer'})
                            await Busqueda.findChoferes(reserva, reser.negados)
                        }
                    }, settings.tiempo_esp*1000)
                }
                else{
                    let data = await Reserva.findById(reserva)
                    reser=data
                    if(reser.estatus==='Pendiente') {
                        neg.push(choferes._id.toString())
                        // Actualizar Base de datos Firebase chofer
                        var ref = db.ref("chofer/" + choferes._id.toString()+ '/reserva');
                        ref.set(null);
                        // ------------Fin-------------------
                        await Reserva.update({ _id: reserva }, { $set: {negados: neg, chofer_temporal:null} })
                        await Chofer.update({_id:choferes._id},{$set:{estatus:'Disponible'}})
                        await Busqueda.findChoferes(reserva, reser.negados)
                    }
                    // await setTimeout(async () => {
                    // }, settings.tiempo_esp*1000)
                }
            }
            else{
                console.log('No hay choferes')
                 // Actualizar Base de datos Firebase
                // Actualizar Base de datos Firebase
                try {
                    var ref = db.ref("reserva/" + reser._id + '/estatus');
                    let user = reser.user._id
                    ref.set('No atendida');
                    // console.log('pasa hasta qui')
                    // ------------Fin-------------------
                    await Reserva.update({ _id: reserva}, { $set: {estatus:'No atendida'}})
                    socket.emit('no',reser)
                    Notificaciones.enviar(reser.user.fcmtoken, 'No hay choferes disponibles', 'No hemos encontrado choferes para tu viaje', reser._id, 'no')
                    return null                        
                } catch (error) {
                    console.log(error)
                }
            }
        }
    },

    geocode: (origen)=>{
        let ini = origen.lat.toString()+','+origen.lng.toString()
        let info={}
        return rp(`https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyCeheP7N3nMtkIeE2P56lW1umQM1fyHCwE&address=${ini}`)
            .then(function(body){
                let data = JSON.parse(body)
                for (let i = 0; i < data.results.length; i++) {
                    for (let e = 0; e < data.results[i].address_components.length; e++) {
                        for (let x = 0; x < data.results[i].address_components[e].types.length; x++) {
                            if(data.results[i].address_components[e].types[x] == 'locality') {
                                info.ciudad = data.results[i].address_components[e].long_name
                            }else if(data.results[i].address_components[e].types[x] == 'administrative_area_level_1'){
                                info.estado =data.results[i].address_components[e].long_name
                            }
                        }
                    }
                }
                return info
            })
    },
    async calculos(origen, destino, vehiculo,ida_vuelta, puntos=null){
        let ini
        origen.lat?ini=origen.lat.toString()+','+origen.lng.toString()
        :ini=origen.latitude.toString()+','+origen.longitude.toString()
        let dest
        destino.latitude?dest=destino.latitude.toString()+','+destino.longitude.toString()
        :dest = destino.lat.toString()+','+destino.lng.toString()
        let info, distance, tiempo, vuelta
        let body = await rp(`https://maps.googleapis.com/maps/api/directions/json?units=metric&origin=${ini}&destination=${dest}&key=AIzaSyCeheP7N3nMtkIeE2P56lW1umQM1fyHCwE`)
        let settings = await Settings.find()
        let data = JSON.parse(body)
        let dist = puntos&&puntos.length>1?geolib.getPathLength(puntos):data.routes[0].legs[0].distance.value
        if(ida_vuelta){
            vuelta = await rp(`https://maps.googleapis.com/maps/api/directions/json?units=metric&origin=${dest}&destination=${ini}&key=AIzaSyCeheP7N3nMtkIeE2P56lW1umQM1fyHCwE`)
            vuelta = JSON.parse(vuelta)
            distance = data.routes[0].legs[0].distance.value+vuelta.routes[0].legs[0].distance.value
            tiempo = data.routes[0].legs[0].duration.value+vuelta.routes[0].legs[0].duration.value    
        }
        else{
            distance=(data.routes[0].legs[0].distance.value)
            tiempo=data.routes[0].legs[0].duration.value
        }
        if(vehiculo==='Moto'&&distance>settings.dist_max_m){
            return info=null    
        }
        else{
            if(puntos&&puntos.length>1){
                distance=geolib.getPathLength(puntos)
            }
            let costo =  await Busqueda.calcularCosto(origen,destino,vehiculo,dist,settings,ida_vuelta)
            // console.log(costo)
            info ={
                origen: origen,
                destino: destino,
                distancia: (distance / 1000).toFixed(2).toString()+' km',
                tiempo: tiempo,
                costo: costo,
                vehiculo,
                ida_vuelta,
                puntos: data.routes[0].legs[0].steps.length,
                polyline: data.routes[0].overview_polyline.points,
                pasos: data.routes[0].legs[0].steps,
                salida:data.routes[0].legs[0].start_address,
                llegada:data.routes[0].legs[0].end_address
            }
            if(ida_vuelta){
                info.pasos_vuelta=vuelta.routes[0].legs[0].steps
            }
            return info  
        }
    },
    ubicar:(origen)=>{
        let zonas
        let ubicado=false
        return Geocerca.find()
            .then(res=>{
                zonas=res
                for(let i=0;i<zonas.length;i++){
                    let item = zonas[i].polygono[0][0]
                    let resp =geolib.isPointInside(origen,item)
                    if(resp){
                        ubicado=zonas[i]
                    }
                }
                return ubicado
            })
            .catch(error=>console.log(error))
    },
    buscarRuta:(salida,llegada,vehiculo,ida_vuelta)=>{
        return Ruta.findOne({salida:salida, llegada:llegada})
            .then(res=>{
                if(res===null){
                    return Ruta.findOne({salida:llegada, llegada:salida})
                        .then(ruta=>{
                            if(ruta===null){
                                return false
                            }
                            else{
                                if(vehiculo==='Moto'){
                                    return ida_vuelta?ruta.ida_vuelta_m:ruta.precio_m
                                }else{
                                    return ida_vuelta?ruta.ida_vuelta:ruta.precio
                                }
                            }
                        })
                        .catch(error=>console.log(error))
                }
                else{
                    if(vehiculo==='Moto'){
                        return ida_vuelta?res.ida_vuelta_m:res.precio_m
                    }else{
                        return ida_vuelta?res.ida_vuelta:res.precio
                    }
                }
            })
            .catch(error=>console.log(error))
    },
    calcularCosto: async (origen, destino,vehiculo,distancia, settings,ida_vuelta)=>{
        let precio
        //Se ubica el origen en una zona
        let res = await Busqueda.ubicar(origen)
        //Se ubica el destino en una zona
        let resp = await Busqueda.ubicar(destino)
        //Si ambas posiciones estan en una zona, se busca una ruta entre ellas 
        if(res!==false&&resp!==false){
            return Busqueda.buscarRuta(res._id,resp._id,vehiculo,ida_vuelta)
                .then(ruta=>{
                    //Si existe una ruta entre ellas, se retorna el precio 
                    if(ruta!==false){
                        return ruta
                    }
                    //Si no existe una ruta entre ellas, se pregunta cual es el criterio de preferencia 
                    //entre zona de salida y llegada. Cual sea el caso, se retorna el precio conforme al criterio de referencia
                    //
                    else{
                        if(settings.preferencia==='Salida'){
                            if(vehiculo==='Moto'){
                                return ida_vuelta?resp.costo_salida_m * distancia+(resp.costo_salida_m * distancia * (settings.ida_vuelta / 100)): resp.costo_salida_m * distancia
                            }else{
                                return ida_vuelta?resp.costo_salida * distancia+(resp.costo_salida * distancia * (settings.ida_vuelta / 100)): resp.costo_salida * distancia
                            }
                        }
                        else{
                            if(vehiculo==='Moto'){
                                return ida_vuelta? res.costo_destino_m * distancia+(res.costo_destino_m * distancia*(settings.ida_vuelta / 100)):res.costo_destino_m * distancia
                            }else{
                                return ida_vuelta? res.costo_destino * distancia+(res.costo_destino * distancia*(settings.ida_vuelta / 100)):res.costo_destino * distancia
                            }
                        }
                    }
                })
                .catch(error=>console.log(error))
        }
        //Si el destino no esta en una zona de llegada, se toma en cuenta la zona en la que se encuentra el origen
        else if(resp!==false){
            if(vehiculo==='Moto'){
                return ida_vuelta? resp.costo_destino_m*distancia+(resp.costo_destino_m*distancia*(settings.ida_vuelta / 100)):resp.costo_destino_m*distancia
            }else{
                return ida_vuelta? resp.costo_destino*distancia+(resp.costo_destino*distancia*(settings.ida_vuelta / 100)):resp.costo_destino*distancia
            }
        }
        //Si el origen no esta en una zona de llegada, se toma en cuenta la zona en la que se encuentra el destino
        else if(res!==false){
            if(vehiculo==='Moto'){
                return ida_vuelta?res.costo_salida_m*distancia+(res.costo_salida_m*distancia*(settings.ida_vuelta / 100)):res.costo_salida_m*distancia
            }else{
                return ida_vuelta?res.costo_salida*distancia+(res.costo_salida*distancia*(settings.ida_vuelta / 100)):res.costo_salida*distancia
            }
        }
        //Si destino y origen no se encuentran en zonas, se calcula el precio en base a los intervalos de distancia
        else{
            let int
            if(vehiculo==='Moto'){
                int = settings.intervalo_m
            }
            else{
                int = settings.intervalo
            }
            int = int.filter(el=>{
                if(el.dist_max){
                    return el.dist_min<=distancia&&el.dist_max>=distancia
                }else{
                    return el.dist_min<=distancia
                }
            })
            int=int[0]
            if(int.tarifa_base&&int.tarifa_base!==null&&int.tarifa_base>0&&(!int.tarif_km||int.tarif_km===null||int.tarif_km===0)){
                return ida_vuelta?int.tarifa_base+(int.tarifa_base*(settings.ida_vuelta / 100)):int.tarifa_base
            }
            else if((!int.tarifa_base||int.tarifa_base===null||int.tarifa_base===0)&&int.tarif_km&&int.tarif_km>0&&int.tarif_km!==null){
                return ida_vuelta? int.tarif_km*distancia+(int.tarif_km*distancia*(settings.ida_vuelta / 100)) : int.tarif_km*distancia
            }
            else{
                precio = (int.tarif_km*distancia)+int.tarifa_base
                return ida_vuelta?precio+(precio*(settings.ida_vuelta / 100)): precio
            }
        }
    }
}