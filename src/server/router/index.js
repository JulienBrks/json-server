var express = require('express')
var methodOverride = require('method-override')
var bodyParser = require('body-parser')
var _ = require('lodash')
var _db = require('underscore-db')
var low = require('lowdb')
var fileAsync = require('lowdb/lib/file-async')
var plural = require('./plural')
var nested = require('./nested')
var singular = require('./singular')
var mixins = require('../mixins')

module.exports = function (source) {

  // Create router
  var router = express.Router()

  // Add middlewares
  router.use(bodyParser.json({limit: '10mb'}))
  router.use(bodyParser.urlencoded({extended: false}))
  router.use(methodOverride())

  // Create database
  var db
  if (_.isObject(source)) {
    console.log('enter');
    db = low()
    db.setState(source)
  } else {
    db = low(source, { storage: fileAsync })
  }

  // Add underscore-db methods to db
  db._.mixin(_db)

  // Add specific mixins
  db._.mixin(mixins)

  // Expose database
  router.db = db

  // Expose render
  router.render = function (req, res) {
    res.jsonp(res.locals.data)
  }

  // GET /db
  function showDatabase (req, res, next) {
    res.locals.data = db.getState()
    next()
  }

  router.get('/db', showDatabase)

  router.use(nested(db))

  // Create routes
  db.forEach(function (value, key) {
    if (_.isPlainObject(value)) {
      router.use('/' + key, singular(db, key))
      return
    }

    if (_.isArray(value)) {
      router.use('/' + key, plural(db, key))
      return
    }

    var msg =
      'Type of "' + key + '" (' + typeof value + ') ' +
      (_.isObject(source) ? '' : 'in ' + source) + ' is not supported. ' +
      'Use objects or arrays of objects.'

    throw new Error(msg)
  }).value()

  router.use(function (req, res) {
    if (!res.locals.data) {
      res.status(404)
      res.locals.data = {}
    }

    router.render(req, res)
  })

  router.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send(err.stack)
  })

  return router
}
