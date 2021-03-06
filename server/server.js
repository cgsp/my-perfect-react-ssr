const express = require('express')
const favicon = require('serve-favicon')
const bodyParser = require('body-parser')
const session = require('express-session')
// const ReactSSR = require('react-dom/server')
const serverRender = require('./utils/server-render')
const fs = require('fs')
const path = require('path')

const isDev = process.env.NODE_ENV === 'development'

const app = express()

// 将请求上面的数据，全部转换为req.body上面的数据
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// 配置session,真正上线的话，session是存在数据库里面的，
// 本例中，是存放在本机的内存中
app.use(session({
  // 10分钟
  maxAge: 10 * 60 * 1000,
  // 设置浏览器端的cookieid
  name: 'gspid',
  // 每次请求，是否会生产一个新的cookieid,
  // false的话，不需要，设置true的话，需要，但是会造成比较大的资源浪费
  resave: false,
  saveUninitialized: false,
  // 根据这个字符串在浏览器端加密cookie
  secret: 'gsp react ssr'
}))

// 需要在服务端渲染的代码之前使用
app.use(favicon(path.join(__dirname, '../gsp.ico')))

// 下面这 2 个API路由，需要在服务端渲染的代码之前使用
app.use('/api/user', require('./utils/handle-login'))
app.use('/api', require('./utils/proxy'))

if (!isDev) {
  // 如果不是Dev环境，就去硬盘上面读取
  const serverEntry = require('../dist/server-entry')
  // const serverEntry = require('../dist/server-entry').default
  // 同步地读取文件,必须指定是utf8，这样才能按照string读取,不然就是个buffer
  const template = fs.readFileSync(path.join(__dirname, '../dist/server.ejs'), 'utf8')
  app.use('/public', express.static(path.join(__dirname, '../dist')))
  app.get('*', function (req, res, next) {
    // const appString = ReactSSR.renderToString(serverEntry)
    // res.send(template.replace('<!-- app -->', appString))
    serverRender(serverEntry, template, req, res)
      .catch(next)
  })
} else {
  // 如果是Dev环境，就去内存里面读取
  const devStatic = require('./utils/dev-static')
  devStatic(app)
}

app.use(function (error, req, res, next) {
  console.log(error)
  res.status(500).send(error)
})

app.listen(3333, function () {
  console.log('node服务在3333端口')
})
