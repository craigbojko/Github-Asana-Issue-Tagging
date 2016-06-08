/*
  API KEY

  0/2091ef2a217d3450b1bca5feb79017cb
  this.GROWTH_ID = '32972561372564'
// 84443890601556
*/

require('colors')
var Promise = require('Promise')
var Asana = require('asana')
var Table = require('cli-table')
var tagIds = require('./tagIds')

function authoriseAsana () {
  return Asana.Client.create().useBasicAuth('3lK6MYFb.IP1FVS4J2qHlkN6QMgDPDLE')
}

function AsanaTagging () {
  this.client = authoriseAsana()

  this.tagAddTable = new Table({
    head: ['ID', 'Client', 'Title'],
    colWidths: [35, 20, 45]
  })
  this.tagRemoveTable = new Table({
    head: ['ID', 'Client', 'Title'],
    colWidths: [35, 20, 45]
  })
}

AsanaTagging.prototype.getSingleAsanaTask = function (id, cb) {
  this.client.tasks.findById(id).then(function (task) {
    cb(task)
  })
}

AsanaTagging.prototype.addTag = function (task, tag, title) {
  var t = tagIds.labels.qa[tag]
  switch (t) {
    case ('queued'):
      t = t.toString().red
      break
    case ('awaiting-feedback'):
      t = t.toString().yellow
      break
    case ('awaiting-revision'):
      t = t.toString().green
      break
    default: break
  }
  var label = (typeof tagIds.labels.qa[tag] !== 'undefined') ? t : ''

  this.tagAddTable.push(
    [label, task, title]
  )

  return this.client.tasks.addTag(task, {
    tag: tag
  })
}

AsanaTagging.prototype.removeTag = function (task, tag, title) {
  var t = tagIds.labels.qa[tag]
  switch (t) {
    case ('queued'):
      t = t.toString().red
      break
    case ('awaiting-feedback'):
      t = t.toString().yellow
      break
    case ('awaiting-revision'):
      t = t.toString().green
      break
    default: break
  }
  var label = (typeof tagIds.labels.qa[tag] !== 'undefined') ? t : ''

  this.tagRemoveTable.push(
    [label, task, title]
  )

  return this.client.tasks.removeTag(task, {
    tag: tag
  })
}

AsanaTagging.prototype.dryAddTag = function (task, tag, title) {
  var t = tagIds.labels.qa[tag]
  switch (t) {
    case ('queued'):
      t = t.toString().red
      break
    case ('awaiting-feedback'):
      t = t.toString().yellow
      break
    case ('awaiting-revision'):
      t = t.toString().green
      break
    default: break
  }
  var label = (typeof tagIds.labels.qa[tag] !== 'undefined') ? t : ''

  this.tagAddTable.push(
    [label, task, title]
  )
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve(task)
    }, 100)
  })
}

AsanaTagging.prototype.dryRemoveTag = function (task, tag, title) {
  var t = tagIds.labels.qa[tag]
  switch (t) {
    case ('queued'):
      t = t.toString().red
      break
    case ('awaiting-feedback'):
      t = t.toString().yellow
      break
    case ('awaiting-revision'):
      t = t.toString().green
      break
    default: break
  }
  var label = (typeof tagIds.labels.qa[tag] !== 'undefined') ? t : ''

  this.tagRemoveTable.push(
    [label, task, title]
  )

  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve(task)
    }, 100)
  })
}

AsanaTagging.prototype.getAllTags = function (id) {
  this.client.tags.findAll(id).then(function (data) {
    console.log('"%s" Tags include: ', id, data)
  }, function (error) {
    console.log('ERROR IN GETTING TASK TAGS: '.red)
    console.log(error)
  }).catch(function (error) {
    console.log('ERROR IN GETTING TASK: '.red)
    console.log(error)
  })
}

AsanaTagging.prototype.getTask = function (id, cb) {
  return this.client.tasks.findById(id).then(function (data) {
    console.log('"%s" Task: ', id, data)
    cb(data)
  }, function (error) {
    console.log('ERROR IN GETTING TASK: '.red)
    console.log(error)
  }).catch(function (error) {
    console.log('ERROR IN GETTING TASK: '.red)
    console.log(error)
  })
}

AsanaTagging.prototype.getTaskTags = function (id, cb) {
  return this.client.tasks.tags(id).then(function (data) {
    // console.log('"%s" Task Tags: ', id, data)
    cb(data)
  }, function (error) {
    console.log('ERROR IN GETTING TASK: '.red)
    console.log(error)
    cb(error)
  }).catch(function (error) {
    console.log('ERROR IN GETTING TASK: '.red)
    console.log(error)
    cb(error)
  })
}

AsanaTagging.prototype.printAddTable = function () {
  console.log('TAGS ADDED:'.underline.green)
  console.log(this.tagAddTable.toString())
}

AsanaTagging.prototype.printRemoveTable = function () {
  console.log('TAGS REMOVED:'.underline.green)
  console.log(this.tagRemoveTable.toString())
}

module.exports = function () {
  return new AsanaTagging()
}
