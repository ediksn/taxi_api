export const handleError = (error, res) => {
    res.status(500).json({
      message: 'An error ocurred',
      error: error.toString() 
    })
  }
// export const server = 'http://localhost:9000'
export const server = 'http://taxi.dvrve.net:9000'
//  export const server = 'http://192.168.0.104:9000'
// export const server = 'http://192.168.3.106:9000'
// export const server = 'http://192.168.43.5:9000'