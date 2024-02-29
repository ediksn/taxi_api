'use strict'

import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types

const TransSchema = new Schema({
    debe     : Number,
    haber    : Number,
    fecha    : {type: Date, required: true, default: Date.now},
    cliente  : {type: ObjectId, ref: 'Cliente'},
    driver   : {type: ObjectId, ref: 'Chofer'},
    reserva  : {type: ObjectId, ref: 'Reserva'},
    empresa  : {},
    estatus_pago : String,
    estatus  : String,
    iva      : Number,
    comision : Number,
    total    : Number,
    tipo     : String,
    concepto : {type: ObjectId, ref: 'Concepto'},
    direccion: String,
    payer_info: {},
    pay_id    : '',
    AzulAuthorizationCode:'',
    AzulOrderId:'',
    Azul_RRN  :'',
    Azul_Ticket:'',
    Azul_estatus:''  
    })
  
  export default mongoose.model('Trans', TransSchema)
  
