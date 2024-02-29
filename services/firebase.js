var reserva = {
    _id: '',
    origen: {
      lat      : '',
      lng      : ''
    }, 
    destino :{
      lat   : '',
      lng   : ''
    },
    salida  : '',
    llegada : '',
    distancia: '',
    user : {
        _id: '',
        nombre      : '',
        apellido    : '',
        identificacion : '',
        direccion      : '',
        imagen         : { },
        telefono    : '',
        fecha_nac   : '',
        map         : {
        lat: '', 
        lng: ''      
        },     
        email       : '',
        password    : '',
        createdAt   : '',
        saldo       : '',
        bloquedo    : '',
        tipo_def    : '',
        fcmtoken  : '',
        estatus   : '',
    },
    driver   : {
        _id: '',
        nombre      : '',
        apellido    : '',
        identificacion : '',
        fecha_nac      : '',
        unidad         : '',
        vehiculo        : {
            modelo      : '',
            marca       : '',
            placa       : '',
            puestos     : '',
            estatus     : '',
            owner       : '',
            extras      : [],
            images      : [],
            color       : '',
            tipo        : ''
            },
        imagen         : {  },
        telefono    : '',
        email       : '',
        password    : '',
        createdAt   : '',
        estatus     : '',
        orientacion: '',
        map: { 
            lat: '', 
            lng: ''
        },
        viajes      : '',
        valor       : '',
        saldo       : '',
        bloqueado   : '',
        nom_banc    : '',
        tipo_cuenta : '',
        num_cuenta  : '',
        paypal      : '',
        fcmtoken    : '',
        iden        : '',
        licen       : '',
        matricula   : '',
        seguro      : '',
    },
    total    : '',
    costo    : '',
    iva      : '',
    fecha    : '',
    extras   :'',
    ciudad    : '',
    estado    : '',
    vehiculo: '',
    tipo:'',
    timeTripF : '',
    timeTripI : '',
    tiempo    : '',
    timeArrivI : '',
    timeArrivF : '',
    timeArrivEst : '',
    llegado: '',
    horaLlegado: '',
    horaAcep: '',
    horaIni: '',
    horaTerm: '',
    horaAbor: '',
    horaCancel: '',
    estatus  : '',
    estatusPay  : '',
    pay_id   : '',
    razonCancel: '',
    negados     : '',
    booking:   '',
    ruta_chofer: '',
    ruta_cliente: '',
    trans_id    : '',
    fav     : '',
    inicio      : '',
    limite      : '',
    duracion_ext: '',
    duracion: '',
    costo_extra_tiempo: '',
    tiempo_espera: '',
    user_name: '',
    user_lastname: '',
    user_tlf: ''
    }
import { db } from '../config'
export default {
    createReserva: async (data) =>{
        let array = reserva
        Object.keys(reserva).forEach(function(key) {
            if(typeof data[key] === 'object' && key){
                    Object.keys(reserva[key]).forEach(function(val) {
                        if(typeof data[key][val] === 'object'){
                            Object.keys(reserva[key][val]).forEach(function(valor) {
                                if(data[key][val][valor]) array[key][val][valor] = data[key][val][valor]
                            })
                        } else {
                            if(data[key][val]) array[key][val] = data[key][val]
                        }
                    })
            } else {
                if(data[key]) array[key] = data[key]
            }
        });
        array.user._id= data.user._id.toString()
        array._id = data._id.toString()
        console.log(data.user_name)
        console.log(data.user_lastname)
        console.log(array.user_name)
        console.log(array.user_lastname)
        if(data.user.imagen && data.user.imagen.url) {
            array.user.imagen = data.user.imagen
        }
        if(array.user.imagen && !data.user.imagen){
            delete array.user.imagen
        }
        if(array.user_name && !data.user_name){
            delete array.user_name
        }
        var ref = db.ref("reserva/" + data._id);
        await ref.set(array)
    },
    updateReservaChofer: (data, id, driver) =>{
        let array = reserva.driver
        Object.keys(reserva.driver).forEach(function(key) {
            if(data[key]){
                if(typeof data[key] === 'object' && key){
                    Object.keys(reserva.driver[key]).forEach(function(val) {
                        if(typeof data[key][val] === 'object'){
                            Object.keys(reserva.driver[key][val]).forEach(function(valor) {
                                if(data[key][val][valor]) array[key][val][valor] = data[key][val][valor]
                            })
                        } else {
                            if(data[key][val]) array[key][val] = data[key][val]
                        }
                    })
                } else {
                    if(data[key]) array[key] = data[key]
                }
            }
        });
        array._id = driver
        var ref = db.ref("reserva/" + id + '/driver/');
        ref.set(array)
    }
}