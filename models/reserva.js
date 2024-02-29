'use strict'

import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types

const ReservaSchema = new Schema({
    id_num  : Number,
    origen: {
      lat      : { type: Number, required: true },
      lng      : { type: Number, required: true }
    }, 
    destino :{
      lat   : { type: Number, required: true },
      lng   : { type: Number, required: true }
    },
    salida  : String,
    llegada : String,
    distancia: { type: String},
    user     : { type: ObjectId, ref: 'Cliente', required: true },
    driver   : { type: ObjectId, ref: 'Chofer'},
    total    : {type:Number, default:0},
    costo    : {type:Number, default:0},
    iva      : Number,
    fecha    : {type: Date, default: Date.now, required: true},
    extras   :[],
    tipo     : String,
    user_name : String,
    user_lastname: String,
    user_tlf  : String,
    ciudad    : String,
    estado    : String,
    vehiculo: String,
    timeTripF : { type: Date},
    timeTripI : { type: Date},
    tiempo    : { type: String},
    timeArrivI : Date,
    timeArrivF : Date,
    timeArrivEst : String,
    llegado: String,
    horaLlegado: Date,
    horaAcep: Date,
    horaIni: Date,
    horaTerm: Date,
    horaAbor: Date,
    horaCancel: Date,
    puntos:[],
    polyline: [],
    pasos: [],
    pasos_vuelta: [],
    ida_vuelta:Boolean,
    estatus  : { type: String },
    estatusPay  : { type: String },
    pay_id   : { type: String},
    val_cli  : { type: Number },
    comen_cli  : { type: String },
    val_dri  : { type: Number },
    comen_dri  : { type: String },
    razonCancel: String,
    negados     : [],
    booking:   Date,
    ruta_chofer: [],
    ruta_cliente: [],
    trans_id    : {type:ObjectId, ref: 'Trans'},
    fav     :Boolean,
    inicio      : Date,
    limite      : Date,
    duracion_ext: Number,
    duracion: Number,
    costo_extra_tiempo: Number,
    tiempo_espera: Number,
    chofer_temporal:{type:ObjectId, ref: 'Chofer'}
    })
  
  export default mongoose.model('Reserva', ReservaSchema)
  
