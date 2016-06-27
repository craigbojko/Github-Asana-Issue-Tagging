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
    console.log('RESTARTING SERVICE NOW...'.yellow)
    process.exit(1)
  })
}

function checkTagSubroutine (qaItem) {
  return new Promise(function (resolve, reject) {
    var exp = new RegExp(/https?:\/\/app.asana.com\/0\/[0-9]+\/([0-9]+)/i)
    var asanaId = qaItem && qaItem.asana_link && qaItem.asana_link.match(exp)
    var status = qaItem.status
    var title = qaItem.title
    var assignee = qaItem.assignee
    var author = qaItem.author
    var isQAer = false

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
      // console.log('ASANA TASK TAGS: '.magenta)
      // console.log(asanaTags.data)

      var filteredForQaTags = []
      var filteredForQaTagIds = []
      var githubStatusLabel = tags.labels.qa[status]
      var qubitStatusLabel = tags.labels.qa.map[getStatusBasedOnQaer(qaItem)]
      var statushasChanged = true

      for (var i = 0; i < asanaTags.data.length; i++) {
        var tag = asanaTags.data[i]
        if (tags.labels.qa.hasOwnProperty(tag.id)) {
          filteredForQaTags.push(tag)
        }
      }
      for (var t in filteredForQaTags) {
        filteredForQaTagIds.push(tags.ids.qa[filteredForQaTags[t].id])
        if (filteredForQaTags[t].name.indexOf(qubitStatusLabel) !== -1) {
          statushasChanged = false
        }
      }

      // console.log('ASANA ID: '.magenta + asanaId)
      // console.log('GIT URL: '.magenta + qaItem.issue_link)
      // console.log('---------------------------------------')
      // console.log('CURRENT LABELS: '.magenta + JSON.stringify(filteredForQaTags))
      // console.log('GITHUB RESOLVED LABEL: '.magenta + githubStatusLabel)
      // console.log('QUBIT RESOLVED LABEL: '.magenta + qubitStatusLabel)
      // console.log('STATUS CHANGED: '.magenta + '%s', (statushasChanged) ? statushasChanged.toString().green : statushasChanged.toString().red)

      if (statushasChanged) { // apply changes
        for (t in filteredForQaTags) {
          removeTagSubroutine(qaItem, asanaId, filteredForQaTags[t].id, title, asanaTags)
        }
        applyTagSubroutine(qaItem, asanaId, title, asanaTags)
        resolve()
      } else {
        resolve()
      }
      // console.log('=======================================')
    })
  })
}

function removeTagSubroutine (qaItem, asanaId, tagId, title, asanaTags) {
  return new Promise(function (resolve, reject) {
    if (!qaItem || !asanaId || !title || !asanaTags) {
      resolve()
      return
    }

    if (tagId) { // remove current label - undefined if new task
      if (!dryRun) {
        var p1 = asanaTasks.removeTag(asanaId, tagId, title)
        removePromsies.push(p1)
      } else {
        var p3 = asanaTasks.dryRemoveTag(asanaId, tagId, title)
        removePromsies.push(p3)
      }
      removals++
    } else {
      resolve()
    }
  })
}

function applyTagSubroutine (qaItem, asanaId, title, asanaTags) {
  return new Promise(function (resolve, reject) {
    if (!qaItem || !asanaId || !title || !asanaTags) {
      resolve()
      return
    }

    var tag
    if (!qaItem.assignee) { // Red - QA:Queued
      tag = tags.ids.qa.queued
    } else {
      tag = getStatusBasedOnQaer(qaItem)
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

function getStatusBasedOnQaer (qaItem) {
  var assignee = qaItem.assignee
  var author = qaItem.author
  var isQAer = false
  var tag

  for (var i = 0; i < engineers.reviewers.length; i++) {
    if (engineers.reviewers[i].indexOf(assignee) > -1) {
      isQAer = true
      break
    }
  }

  if (assignee === null) {
    tag = tags.ids.qa['queued']
  } else if (author.indexOf(assignee) > -1) { // assigned to author - (green)
    tag = tags.ids.qa['awaiting-revision']
  } else if (author.indexOf(assignee) === -1 && isQAer) { // NOT assigned to author but is to QAer- (yellow)
    tag = tags.ids.qa['awaiting-feedback']
  } else if (author.indexOf(assignee) === -1 && !isQAer) { // NOT assigned to author AND is NOT QAer- (green)
    tag = tags.ids.qa['awaiting-revision']
  } else { // Don't know - just assign it red...
    tag = tags.ids.qa['queued']
  }
  return tag
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

    asanaTasks.printRemoveTable()
    _continue()
  }, function (err) {
    console.log('OPEN REMOVE PROMISES FAIL: '.red, err)
  })
}
