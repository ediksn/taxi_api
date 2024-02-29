'use strict'
import Debug from 'debug'
const debug = new Debug('menu:server:api:blog')
import { Settings } from '../api'

'use strict';
var servidor = "";
var puerto = "";
var correo = "";
var clave = "";

const path = require('path');
var Email = require('email-templates');
var nodemailer = require('nodemailer');
//creds = require('./creds'),
const ejs = require('ejs');

export default {
    enviaremail: async (to, subject, template, data) => {
        // console.log('template:' + template)
        const email = new Email();
        const locals = { userName: 'Elon' };
        
        Promise
        .all([
            email.render(template, data)
        ])
        .then(async ([ html, text ]) => {
            nodemailer.createTestAccount(async (err, account) => {
                // setup email data with unicode symbols
                const data = await Settings.find()
                if (data) {
                    servidor = data.servidor
                    puerto = data.puerto
                    correo = data.correo
                    clave = data.clave
                }
                // console.log(servidor)
                // console.log(puerto)
                // console.log(correo)
                // console.log(clave)
                let mailOptions = {
                    from: '"Appolo Taxi" <'+correo+'>', // sender address
                    to: to, // list of receivers
                    subject: subject, // Subject line
                    html: html // html body
                };
                var transporter = nodemailer.createTransport({
                    host: servidor.toString(),
                    port: puerto.toString(),
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: correo.toString(), // generated ethereal user
                        pass: clave.toString() // generated ethereal password
                    }
                })
                // send mail with defined transport object
                return transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                });
            });
        })
        .catch(console.error);
        
    }
}