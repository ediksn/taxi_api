import request from 'request'
import fs from 'fs'
import { StaticMap } from '../models'
export default {
    create: (pts) => {
        let puntos = ''
        for (let i = 0; i < pts.length; i++) {
            if(i == 0){
                puntos = '|' + pts[i].lat + ',' + pts[i].lng
            }else{
                puntos = puntos + '|' + pts[i].lat + ',' + pts[i].lng
            }
        }
        let filename=Date.now() + '.png'
        let e = pts.length - 1
        // console.log(puntos)
        let uri = `https://maps.googleapis.com/maps/api/staticmap?path=color:0xff0000ff|weight:5${puntos}&size=400x400&markers=anchor:bottom|icon:http://bit.ly/2LIOyZi%7C${pts[e].lat + ',' + pts[e].lng}&key=AIzaSyCeheP7N3nMtkIeE2P56lW1umQM1fyHCwE&markers=anchor:bottom|icon:http://bit.ly/2NFASRb%7C${pts[0].lat + ',' + pts[0].lng}`
        //let uri = `https://maps.googleapis.com/maps/api/staticmap?path=color:0xff0000ff|weight:5${puntos}&size=400x400&key=AIzaSyCDYqH0BXCkPeaBkOID5T5qjTfv7o2rxUQ`
        // console.log(uri)
        request(uri).pipe(fs.createWriteStream('public/images/static/'+filename))
        let map = new StaticMap({
            url: '/images/static/'+filename
        })
        map.save()
        return '/images/static/'+filename
    },
}
