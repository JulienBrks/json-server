var express = require('express')
var pluralize = require('pluralize')
var utils = require('../utils')

module.exports = function (db) {

  var router = express.Router()

  // Rewrite URL (/:resource/:id/:nested -> /:nested) and request query
  function get (req, res, next) {
    // TODO throw error
    var resource = db.get(req.params.resource).getById(utils.toNative(req.params.id), req.params.resource).value()
    var resourceIdName = db.id(req.params.resource).value()

    var nested = db.get(req.params.nested).getById(utils.toNative(req.params.id), req.params.nested).value()
    var nestedIdName = db.id(req.params.nested).value()

    if (nestedIdName === 'id') {
        var prop = pluralize.singular(req.params.nested)
        nestedIdName = prop + 'Id'
    }

    if (resource[nestedIdName].length) {
        req.url = '/' + req.params.nested
        req.query[nestedIdName] = resource[nestedIdName]
    } else {
        req.url = '/' + req.params.nested + '/' + resource[nestedIdName]
    }
    next()
  }

  // Rewrite URL (/:resource/:id/:nested -> /:nested) and request body
  function post (req, res, next) {
    var prop = pluralize.singular(req.params.resource)
    req.body[prop + 'Id'] = utils.toNative(req.params.id)
    req.url = '/' + req.params.nested
    next()
  }

  return router
    .get('/:resource/:id/:nested', get)
    .post('/:resource/:id/:nested', post)
}
