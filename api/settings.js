'use strict'

import { Settings } from '../models'
import Debug from 'debug'
import { Login } from '../services'

const debug = new Debug('taxi:server:api:settings')

export default {
  find: () => {
    debug(`Finding Settings for homepage with limit.`)
    return Settings.findOne()
  },

  findByInterval: async (distancia) => {
    debug(`Finding Settings for homepage with limit.`)
    let set = await Settings.findOne({dist_min:{$lte:JSON.parse(distancia)},$and:[{dist_max:{$gte:JSON.parse(distancia)}},{dist_max:{$exists:true}}]})
    if(!set){
      set = await Settings.findOne({dist_min:{$lte:JSON.parse(distancia)},dist_max:{$exists:false}})
    }  
    return set
  },

  create: (q) => {
    debug(`Creating new Settings`)
        const settings = new Settings(q)
        return settings.save()
  },

  update: (q) => {
    debug(`Updating the settings with id: `)
    return Settings.updateOne({ _id: q._id }, { $set: q })
  },

}