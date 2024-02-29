var socketio = require('socket.io'), 
     io, clients = {}; 

module.exports = {
     startSocketServer: function (app) {
       console.log('socket funcionando') 
       io = socketio.listen(app); 
       var visitas = 0;
       var web = 0;
       var restaurante = 0
       var users = []
       var restaurants = []
       var groupBy = function (miarray, prop) {
        return miarray.reduce(function(groups, item) {
          var val = item[prop];
          groups[val] = groups[val] || {uuid: item.uuid};
          return groups;
        }, {});
      }
       io.sockets.on('connection', function (socket) { 
        //  console.log('nueva conexion')
         let id = socket.id
         let sector
        visitas++;

        socket.on('aviso', arr=>{
          console.log(`Aviso para el chofer ${arr.chofer} sobre la reserva ${arr.reserva}`)
          //console.log(arr)
          io.sockets.in(arr.chofer).emit('viaje', arr)
        })

        socket.on('no', arr=>{
          io.sockets.emit('caducado', arr)
          io.sockets.in(arr.user._id).emit('negado', arr.user)
        })

        socket.on('abort', arr=>{
          console.log('El cliente ha cancelado')
          io.sockets.in(arr.chofer._id).emit('abortado', 'El cliente ha cancelado el viaje')
        })
        
        socket.on('llegado', data=>{
          io.sockets.in(data.id).emit('llega', data.message)
        })

        socket.on('actualizar_chof', data=>{
          io.sockets.emit('act_chof', data.message)
          io.sockets.in(data.chofer).emit('act', 'Su estatus ha sido modificado')
        })

        socket.on('agenda', data=>{
          io.sockets.emit('agend', data.message)
        })

        socket.on('put_chof', data=>{
          io.sockets.emit('putt_chof', data.message)
        })

        socket.on('actualizar_cli', data=>{
          io.sockets.emit('act_cli', data.message)
        })

        socket.on('actualizar_reserv', data=>{
          io.sockets.emit('act_reserv', data.message)
        })
        
        socket.on('actualizar_reserv2', data=>{
          io.sockets.emit('act_reserv2', data.message)
        })

        socket.on('actualizar_retiro', data=>{
          io.sockets.emit('act_retiro', data.message)
        })

        socket.on('actualizar_geo', data=>{
          io.sockets.emit('act_geo', data.message)
        })

        socket.on('actualizar_trans', data=>{
          io.sockets.emit('act_trans', data.message)
        })

        socket.on('terminado', arr=>{
          console.log('El viaje ha finalizado')
          io.sockets.in(arr.user._id).emit('finish', arr)
          io.sockets.in(arr.driver._id).emit('finish', arr)
        })

        socket.on('vencida',arr=>{
          io.sockets.in(arr).emit('vencio','Este viaje ya no se encuentra disponible')
        })

        socket.on('iniciado', arr=>{
          console.log('El viaje ha comenzado')
          io.sockets.in(arr.user).emit('init', 'El viaje ha comenzado')
          io.sockets.in(arr.driver).emit('init', 'El viaje ha comenzado')
        })
        
        socket.on('cancelado', arr=>{
          console.log('El chofer ha cancelado')
          io.sockets.emit('cancelado', 'Viaje cancelado')
          io.sockets.in(arr.chofer).emit('cancel', 'Viaje cancelado')
          io.sockets.in(arr.user._id).emit('cancel', 'Viaje cancelado')
        })

        socket.on('aceptar', arr=>{
          console.log('La reserva ha sido aceptada' + arr.user)
          //console.log(arr)
          io.sockets.emit('aceptado', arr)
          io.sockets.in(arr.user._id).emit('acept', arr)
        })
        socket.on('escucha_chofer', id =>{
          socket.join(id)
          // console.log('join de cliente a chofer' + id)
        })

        socket.on('posicion_chofer', arr =>{
          // console.log('Actualizacion de chofer')
          // console.log(arr[0]._id)
          io.sockets.in(arr._id).emit('act_pos_chofer', arr)
        })

        socket.on('ubicacion', data =>{
          // console.log('ubicacion: '+JSON.stringify(data.coordenadas))
          io.sockets.in(data.cliente).emit('location',data)
        })

        socket.on('devol', data => {
          if (data.estatus === "Aceptado") {
            io.sockets.in(data.cliente).emit('dev',data)
            io.sockets.in(data.chofer).emit('dev',data)
          } else {
            io.sockets.in(data.cliente).emit('dev',data)
          }
        })

        socket.on('pago', data =>{
          io.sockets.in(data.chofer).emit('pagado',data)
          io.sockets.in(data.cliente).emit('pagado',data)
        })

        socket.on('cliente', id =>{
          socket.join(id)
          // console.log('join de usuario')
        })

        socket.on('chofer', id=>{
          socket.join(id)
          // console.log('chofer hizo el join')
        })

        //socket.broadcast.emit('visits', visitas);
         socket.on('admin', function(room) {
          socket.join('admin');
          // console.log('admin = ' + io.sockets.adapter.rooms['admin'].length);
         io.sockets.in('admin').emit('menuusers', visitas);
          });
          socket.on('prueba', function(data) {
            io.sockets.emit('cancelar', data)
          })
         socket.on('web', function(uuid) {
          users.push({uuid: uuid, id: socket.id})
           var resultData = Object.values(groupBy(users,'uuid'));
           visitas = resultData.length
           //console.log(id)
            
            socket.join('web');
            //console.log(users.in)
            //console.log(users)
            //console.log('web = ' + io.sockets.adapter.rooms['web'].length);
            io.sockets.in('admin').emit('menuusers', visitas);
          });
          


          socket.on('web-restaurante', function(room) {
            socket.join(room.id);
            sector = room
            if(!restaurants[room.id]) {
              restaurants[room.id]= []
              restaurants[room.id].push({uuid: room.uuid, id: socket.id})
            }else{
              restaurants[room.id].push({uuid: room.uuid, id: socket.id})
            }
            var resultData = Object.values(groupBy(restaurants[room.id],'uuid'));
            restaurante = resultData.length
            //var resultData = Object.values(groupBy(users,'uuid'));
            //visitas = resultData.length
            io.sockets.in(room.id).emit('enlinea', resultData.length);
         });
         socket.on('room', function(room) {
            socket.join(room);
          });
          socket.on('updateres', function(room) {
            var resultData = Object.values(groupBy(restaurants[room],'uuid'));
            io.sockets.in(room).emit('enlinea', resultData.length);
         });
          socket.on('rest', function(room) {
            io.sockets.in(room.restaurant).emit('message', room);
            io.sockets.in(room.restaurant).emit('enlinea', room);
        });
         socket.on('disconnect', function() { 
            for (let i = 0; i < users.length; i++) {
              let index = users[i].id.indexOf(socket.id)
              if(index > -1) {
                users.splice(i, 1);
              }
            }
            for (let i = 0; i < restaurants.length; i++) {
              let index = users[i].id.indexOf(socket.id)
              if(index > -1) {
                restaurants.splice(i, 1);
              }
            }
            var resultData = Object.values(groupBy(users,'uuid'));
            visitas = resultData.length
            io.sockets.in('admin').emit('menuusers', visitas);
           //socket.broadcast.emit('visits', visitas);
         }); 
         socket.on('connect_device', function (data, fn) { 
            console.log("data from connected device: " + data); 
            for (var col in data) { 
             console.log(col + " => " + data[col]); 
            } 
         }); 
       }); 
     } 
}; 