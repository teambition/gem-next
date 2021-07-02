import * as config from 'config'
import app from './http-server'

app.listen(config.PORT, () => {
  console.log('http serving ...')
})
