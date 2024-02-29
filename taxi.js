'use strict'
import mongoose from 'mongoose'
import { mongoUrl } from './config'
import { 
  Cliente, 
  Chofer, 
  Usuario, 
  Reserva, 
  Settings, 
  Vehiculo, 
  Extra, 
  Tipo, 
  Trans, 
  Concepto, 
  Stats, 
  Test, 
  Retiros, 
  Secuencia, 
  Permisos, 
  Geocerca, 
  Notificaciones, 
  Ruta,
  Dev,
  Mensaje,
  Consulta } from './routes'
import Reservas from './api/reserva'
import {Busqueda} from './services'
const moment = require('moment');
var cookieParser = require('cookie-parser')
const debug = require('debug')('taxi:server')
const http = require('http')
const chalk = require('chalk')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const port = process.env.PORT || 9000
const app = express()
const server = http.createServer(app)
var sockets = require('./socket')
const schedule = require('node-schedule')

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())
app.use(express.static('public'));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('view engine', 'ejs');
app.use('/api/concepto/', Concepto)
app.use('/api/notificaciones/', Notificaciones)
app.use('/api/permisos/', Permisos)
app.use('/api/ruta/', Ruta)
app.use('/api/secuencia/', Secuencia)
app.use('/api/geocerca/', Geocerca)
app.use('/api/retiros/', Retiros)
app.use('/api/cliente/', Cliente)
app.use('/api/chofer/', Chofer)
app.use('/api/reserva/', Reserva)
app.use('/api/usuario/', Usuario)
app.use('/api/settings/', Settings)
app.use('/api/vehiculo/', Vehiculo)
app.use('/api/extra/', Extra)
app.use('/api/tipo_pago/', Tipo)
app.use('/api/trans/', Trans)
app.use('/api/stats/', Stats)
app.use('/api/test/', Test)
app.use('/api/devolucion/', Dev)
app.use('/api/consulta/', Consulta)
app.use('/api/mensaje/', Mensaje)
app.use((err, req, res, next) => {
  debug(`Error: ${err.message}`)

  if (err.message.match('/not found/')) {
    return res.status(404).send({ err: err.message })
  }

  res.status(500).send({ error: err.message })
})

function handleFatalError (err) {
  console.error(`${chalk.red(['fatal error'])} ${err.message}`)
  console.error(err.stack)
}

sockets.startSocketServer(server)

async function start () {
  const db = await mongoose.connect(mongoUrl)
  if (!module.parent) {
    process.on('uncaughtException', handleFatalError)
    process.on('unhandledRejection', handleFatalError)

    server.listen(port, '0.0.0.0', () => {
      console.log(`${chalk.green('[taxi-server]')} server listening on port ${port}`)
    })
    // let fecha = moment().add(5,'s')
    // let fe = moment(fecha).format('YYYY-MM-DDTHH:mm:ss.0000Z')
    // console.log(fe)
    // var job = schedule.scheduleJob(fe,()=>{
    //   console.log('se ejecuta con esa fecha '+fe)
    // })
    let reservas = await Reservas.find()
    reservas.forEach(element => {
      if (element.booking && element.estatus === 'Pendiente') {
        let date = moment(element.booking).add(4,'h').format('YYYY-MM-DDTHH:mm:ss.000Z')
        date =new Date(date)
        // console.log(date)
        // console.log(new Date)
        try {
          let agenda = schedule.scheduleJob(date, function () {
            Busqueda.findChoferes(element._id, [])
          })
        } catch (error) {
          console.log(error)
        }
      }
    });
  }

}
start()