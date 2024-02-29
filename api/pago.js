'use strict'

import { Pago } from '../models'
import Debug from 'debug'
import { Login } from '../services'

const debug = new Debug('taxi:server:api:pago')

export default {
    find:()=>{
        debug(`Finding pagos`)
        return Pago.find()
    },
    create: (q) => {
        debug(`Creating new pago`)
        const pago = new Pago(q)
        return pago.save()
    },

}