'use strict'

const services = require('../services')
import { Login } from '../services'
import { resolve } from 'dns';

function isAuth(req, res, next) {
    //console.log(req.body)
    if (!req.headers.authorization) {
        return res.status(403).send({status:'denied', message: 'No tienes autorización' })
    }
    const token = req.headers.authorization.split(' ')[1]
    Login.decodeTok(token, res)
        .then(response => {
            req.user = response
            next()
        })
        .catch(response => {
            res.status(response.status)
        })
}

function isCliente(req, res, next) {
    //console.log(req.body)
    if (!req.headers.authorization) {
        return res.status(403).send({status:'denied', message: 'No tienes autorización' })
    }
    const token = req.headers.authorization.split(' ')[1]
    Login.decodeTok(token, res)
        .then(response => {
            if(response.rol=='Cliente'|| response.rol=='Usuario')
            {
                req.user = response
                next()
            }
            else{
                return res.status(403).send({status:'denied', message: 'No tienes autorización' })
            }
        })
        .catch(response => {
            res.status(response.status)
        })
}

function permisos(ruta, accion) {
    return function(req, res, next) {
        if (!req.headers.authorization) {
            return res.status(403).send({status:'denied', message: 'No tienes autorización' })
        }
    const token = req.headers.authorization.split(' ')[1]
    Login.decodeTokenPer(token, res)
        .then(response => {
            req.user = response
            let userId = response
            let bols = false
            for (let i = 0; i < response.per.length; i++) {
                for (let j = 0; j < ruta.length; j++) {
                    if (ruta[j] === response.per[i].ruta) {
                        for (let e = 0; e < response.per[i].accion.length; e++) {
                            if (accion === response.per[i].accion[e]) {
                                bols = true
                            }
                        }
                    }
                }
            }
            if (bols === true) {
                next()
            }
            if (bols === false) {
                console.log({message: 'No Tienes los Permisos Necesarios'})
                return res.status(403).send({message: 'No Tienes los Permisos Necesarios'})
            }
        })
        .catch(response => {
          res.status(response.status)
        })
    }

}

function isUsuario(req, res, next) {
    //console.log(req.body)
    if (!req.headers.authorization) {
        return res.status(403).send({status:'denied', message: 'No tienes autorización' })
    }
    const token = req.headers.authorization.split(' ')[1]
    Login.decodeTok(token, res)
        .then(response => {
            if(response.rol=='Usuario')
            {
                req.user = response
                next()
            }
            else{
                return res.status(403).send({status:'denied', message: 'No tienes autorización' })
            }
        })
        .catch(response => {
            res.status(response.status)
        })
}

function isChofer(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(403).send({status:'denied', message: 'No tienes autorización' })
    }
    const token = req.headers.authorization.split(' ')[1]
    Login.decodeTok(token, res)
        .then(response => {
            if(response.rol=='Chofer'|| response.rol=='Usuario')
            {
                req.user = response
                next()
            }
            else{
                return res.status(403).send({status:'denied', message: 'No tienes autorización' })
            }
        })
        .catch(response => {
            res.status(response.status)
        })
}

module.exports={
    isAuth, isChofer, isCliente, isUsuario, permisos
}