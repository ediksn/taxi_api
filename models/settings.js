'use strict'

import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types

const SettingsSchema = new Schema({

    servidor       : String,
    correo         : String,
    clave          : String,
    puerto         : String,
    tarifa         : Number,
    comision       : Number,
    cost_espera    : Number,
    dist_max_m     : Number,
    perim_busq     : Number,
    perim_cli      : Number,
    tarifa_ext     : Number,
    tiempo_esp     : Number,
    espera_max     : Number,
    preferencia    : String,
    ida_vuelta     : Number,
    intervalo      :[],
    intervalo_m    :[],
    })
  
  export default mongoose.model('Settings', SettingsSchema)
  
