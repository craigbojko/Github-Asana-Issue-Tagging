require('colors')
var tags = require('./tagIds')
var engineers = require('./engineerIds')
var Table = require('cli-table')
var AsanaTasks = require('./asanaTasks')
var Promise = require('Promise')

var asanaTasks
var addPromsies
var removePromsies
var checkPromises
var additions = 0
var removals = 0
var dryRun

module.exports = mainApp

function mainApp (qaItems, _continue, _dryRun) {
  asanaTasks = AsanaTasks()
  dryRun = _dryRun
  additions = 0
  removals = 0
  addPromsies = []
  removePromsies = []
  checkPromises = []

  for (var key in qaItems) {
    checkPromises.push(checkTagSubroutine(qaItems[key]))
  }
  Promise.all(checkPromises).then(function () {
    finishRoutine(_continue)
  }).catch(function (error) {
    console.log('ERROR IN ACQUIRING TASK EXISTING TAGS: '.red)
    console.log(error)
  })
}

function checkTagSubroutine (qaItem) {
  return new Promise(function (resolve, reject) {
    var exp = new RegExp(/https?:\/\/app.asana.com\/0\/[0-9]+\/([0-9]+)/i)
    var asanaId = qaItem && qaItem.asana_link && qaItem.asana_link.match(exp)
    var status = qaItem.status
    var title = qaItem.title

    if (asanaId && asanaId.length > 1) {
      asanaId = parseInt(asanaId[1], 10)
    } else {
      console.log('WARNING:: NO ASANA ID FOR: '.red, asanaId, title)
      resolve()
      return
    }

    asanaTasks.getTaskTags(asanaId, function (asanaTags) {
      // console.log(asanaTags)

      // if asanaTags === empty?
      var currentLabel = asanaTags && asanaTags.data && asanaTags.data[0] && asanaTags.data[0].name
      for (var label in tags.ids.qa) {
        for (var j = 0; j < asanaTags.data.length; j++) {
          if (asanaTags.data[j].name.indexOf(tags.ids.qa[label]) !== -1) {
            currentLabel = asanaTags.data[j].name
          }
        }
      }

      var currentLabelId = tags.ids.qa[currentLabel]
      var mappedLabel = tags.labels.qa[status]
      var statushasChanged = (currentLabel && currentLabel.indexOf(mappedLabel) !== -1) ? 0 : 1

      // console.log('ASANA ID: ' + asanaId)
      // console.log('---------------------------------------')
      // console.log('CURRENT LABEL: ' + currentLabel)
      // console.log('CURRENT LABEL ID: ' + currentLabelId)
      // console.log('MAPPED LABEL: ' + mappedLabel)
      // console.log('STATUS CHANGED: ' + statushasChanged)
      // console.log('=======================================')

      if (statushasChanged) { // apply changes
        if (currentLabelId) { // remove current label - undefined if new task
          if (!dryRun) {
            var p1 = asanaTasks.removeTag(asanaId, currentLabelId, title)
            removePromsies.push(p1)
          } else {
            var p3 = asanaTasks.dryRemoveTag(asanaId, currentLabelId, title)
            removePromsies.push(p3)
          }
          removals++
        }

        applyTagSubroutine(qaItem, asanaId, title, asanaTags).then(function () {
          resolve()
        })
      } else {
        resolve()
      }
    })
  })
}

function applyTagSubroutine (qaItem, asanaId, title, asanaTags) {
  return new Promise(function (resolve, reject) {
    if (!qaItem || !asanaId || !title || !asanaTags) {
      resolve()
      return
    }

    var assignee = qaItem.assignee
    var author = qaItem.author
    var isQAer = false
    var tag

    if (!assignee) { // Red - QA:Queued
      tag = tags.ids.qa.queued
    } else {
      for (var i = 0; i < engineers.reviewers.length; i++) {
        if (engineers.reviewers[i].indexOf(assignee) > -1) {
          isQAer = true
          break
        }
      }
      if (author.indexOf(assignee) > -1) { // assigned to author - (green)
        tag = tags.ids.qa['awaiting-revision']
      } else if (author.indexOf(assignee) === -1 && isQAer) { // NOT assigned to author but is to QAer- (yellow)
        tag = tags.ids.qa['awaiting-feedback']
      } else if (author.indexOf(assignee) === -1 && !isQAer) { // NOT assigned to author AND is NOT QAer- (green)
        tag = tags.ids.qa['awaiting-revision']
      } else { // Don't know - just assign it red...
        tag = tags.ids.qa['queued']
      }
    }

    if (!dryRun) {
      if (tag) {
        var p2 = asanaTasks.addTag(asanaId, tag, title)
        addPromsies.push(p2)
        additions++
        resolve()
      }
    } else {
      if (tag) {
        var p4 = asanaTasks.dryAddTag(asanaId, tag, title)
        addPromsies.push(p4)
        additions++
        resolve()
      }
    }
  })
}

function finishRoutine (_continue) {
  Promise.all(addPromsies).then(function (data) {
    console.log('RUNNING FINAL ADD SUBROUTINE')
    var table = new Table({
      head: ['Label Additions'.cyan, 'Label Removals'.cyan],
      colWidths: [20, 20]
    })

    table.push(
      [additions, removals]
    )

    asanaTasks.printAddTable()
    console.log(table.toString())

    _continue()
  }, function (err) {
    console.log('OPEN ADD PROMISES FAIL: '.red, err)
  })

  Promise.all(removePromsies).then(function (data) {
    console.log('RUNNING FINAL REMOVE SUBROUTINE')
    var table = new Table({
      head: ['Label Additions'.cyan, 'Label Removals'.cyan],
      colWidths: [20, 20]
    })

    table.push(
      [additions, removals]
    )

    asanaTasks.printRemoveTable()
    console.log(table.toString())

    _continue()
  }, function (err) {
    console.log('OPEN REMOVE PROMISES FAIL: '.red, err)
  })
}
