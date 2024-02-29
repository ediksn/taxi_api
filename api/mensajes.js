'use strict'

import { Usuarios } from '../models'
import Debug from 'debug'
var twilio = require('twilio');
const debug = new Debug('menu:server:api:usuarios')
var accountSid = 'AC5b29b798e3c3841fdd3a8592b4e464c9'; // Your Account SID from www.twilio.com/console
var authToken = 'ef72dfeac67f2b628d6cff25a228fc64';   // Your Auth Token from www.twilio.com/console
var client = new twilio(accountSid, authToken);
var https = require('https');
var Request = require("request");
const Cliente= require('authy-client').Client;
const authy = new Cliente({key: '0npsovpmPG7M8oKH3P11dLNRdAWbMxAh'});

const enums = require('authy-client').enums;


export default {
    verificar: (phone) => {
        console.log(phone)
        let verify = ''
        if(phone == '04123800046' || phone == '4123800046' || phone == '123800046' || phone == '04213800046') {
            verify = authy.startPhoneVerification({ countryCode: '58', locale: 'es', phone: phone, via: enums.verificationVia.SMS }, function(err, response) {
                if(err) return err
                return response
            });
        }else{
            verify = authy.startPhoneVerification({ countryCode: '1', locale: 'es', phone: phone, via: enums.verificationVia.SMS }, function(err, response) {
                if(err) console.log(err)
                console.log('Phone information', response);
                return response
            });
        }
       
        return verify
    },
    recovery: (clave, telefono) =>{
        client.messages.create({
            body: 'Recuperacion de Contraseña, tu nueva contraseña es ' + clave,
            to: '+1' + telefono,  // Text this number
            from: '+18502795243' // From a valid Twilio number
        })
        .then((message) => {
            console.log(message);
          }, (reason) => {
            console.log(reason);
          });
    },
    enviarmensaje: (data, ticket) => {
        client.messages.create({
            body: 'Bienvenido Apolo Valet App, Tu numero de ticket es:' + data.ticket + ' Ingresa en este link: http://apolovalet.com/cliente/'+ ticket,
            to: '+1' + data.telefono,  // Text this number
            from: '+18502795243' // From a valid Twilio number
        })
        .then((message) => {
            console.log(message);
          }, (reason) => {
            console.log(reason);
          });
    },
    sendNotification: (data) => {
        var headers = {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": "Basic ZTE1NDg3NWItMzZjOS00NGU5LWE3YzEtMmJlMjI0YTU4OTY1"
        };
            
        var options = {
            host: "onesignal.com",
            port: 443,
            path: "/api/v1/notifications",
            method: "POST",
            headers: headers
        };
            
        var https = require('https');
        var req = https.request(options, function(res) {  
            res.on('data', function(data) {
            console.log("Response:");
            console.log(JSON.parse(data));
            });
        });
            
        req.on('error', function(e) {
            console.log("ERROR:");
            console.log(e);
        });
        
        req.write(JSON.stringify(data));
        req.end();
      }
}