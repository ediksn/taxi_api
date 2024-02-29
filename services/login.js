'use strict'
const jwt = require('jwt-simple')
const moment = require('moment')
const config = require('../config')
import {db} from '../config'
import Debug from 'debug'

const debug = new Debug('taxi:server:api:Login')

export default {
    createToken: async (user, rol) => {
    debug(`Finding login for createToken.`)
    const payload = {
        sub: user._id,
        per: user.permisos,
        rol: rol,
        iat: moment().unix()
    }
    var ref=db
    if(rol==='Chofer'){
        await ref.ref('chofer/'+user._id+'/token').set(jwt.encode(payload, config.SECRET_TOKEN))
    }else if(rol==='Cliente'){
        await ref.ref('cliente/'+user._id+'/token').set(jwt.encode(payload, config.SECRET_TOKEN))
    }
    return jwt.encode(payload, config.SECRET_TOKEN)
  },
  decodeTokenPer: (token, res) => {
    const decoded = new Promise((resolve, reject) => {
        try {
            const payload = jwt.decode(token, config.SECRET_TOKEN)
            resolve(payload)
        } catch (err) {
            return res.status(401).send({ message: `Token Invalido`, status: 'denied', redirect: '/login.html' })
        }
    })

    return decoded
},
decodeTok: (token,res) => {
    const decoded = new Promise((resolve, reject) => {
        try {
            const payload = jwt.decode(token, config.SECRET_TOKEN)
            if(payload.rol!=='Usuario'){
                db.ref(payload.rol.toLowerCase()+'/'+payload.sub.toString()+'/token').once('value').then(data=>{
                    if(data.val()===token){
                        resolve(payload)
                    }else{
                        return res.status(401).send({ message: `Token Invalido`, status: 'denied', redirect: '/login.html' })        
                    }
                })
            }else{
                resolve(payload)
            }
        } catch (err) {
            return res.status(401).send({ message: `Token Invalido`, status: 'denied', redirect: '/login.html' })
        }
    })
    return decoded
}
  
}