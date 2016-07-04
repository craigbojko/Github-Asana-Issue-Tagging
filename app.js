// TODO -
/*
  Determine existing tags and remove/add only if necessary
  asanaTasks.getAllTags(85565100719132)

  Determine if Assignee is QA'er and add relevant tag vs who original owner is - DONE
*/

require('colors')
var fs = require('fs')
var clear = require('clear')
var Promise = require('Promise')
var cron = require('node-schedule')

var gitIssues = require('./src/modules/gitIssues')
var CustomError = require('./src/modules/customError')

var DRYRUN = false

function logError (error) {
  console.log(error.stack.toString().red)
}

// Initial run
try {
  clear()
  runApp()
  // runDebug()
} catch (e) {
  logError(e)
}

try {
  // Schedule run
  var rule = new cron.RecurrenceRule()
  rule.minute = [0, 10, 20, 30, 40, 50]
  cron.scheduleJob(rule, function () {
    console.log('RUNNING NODE APPLICATION FROM SCHEDULE: ', new Date())
    runApp()
  })
} catch (e) {
  logError(e)
  process.exit()
}

function runDebug () {
  DRYRUN = true
  runApp()
}

function runApp () {
  var d = new Date()
  var lastrun
  try {
    lastrun = fs.readFileSync('.lastrun')
    var lrCheck = new Date(lastrun).toISOString()
    if (!lrCheck) {
      throw new CustomError(1, 'CANNOT READ LAST RUN')
    }
  } catch (e) {
    lastrun = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1).toISOString()
  }

  console.log('Lastrun: %s'.cyan, lastrun)
  console.log('RUNNING CLOSED ISSUE SUBROUTINE...'.yellow)
  runClosed(lastrun).then(function () {
    console.log('CLOSED PROMISE RESOLVED'.green)
    console.log('RUNNING OPEN ISSUE SUBROUTINE...'.yellow)
    runOpen().then(function () {
      console.log('OPEN PROMISE RESOLVED'.green)
    }, function (err) {
      console.log('OPEN PROMISE ERROR: '.red + err)
    })
  }, function (err) {
    console.log('CLOSED PROMISE ERROR: '.red + err)
  })
}

function updateLastRun () {
  var completeTime = new Date().toISOString()
  console.log('LAST RUN UPDATED TO: '.green, completeTime)
  fs.writeFile('.lastrun', completeTime, 'utf8', function (err) {
    if (err) {
      throw err
    }
  })
}

function runClosed (lastrun) {
  var lastRunDate = new Date(lastrun)
  var offsetLastRun = new Date(lastRunDate.getFullYear(), lastRunDate.getMonth(), lastRunDate.getDate(), lastRunDate.getHours(), lastRunDate.getMinutes() - 5).toISOString()
  console.log('NEW LAST RUN DATE: '.cyan, offsetLastRun)
  return new Promise(function (resolve, reject) {
    gitIssues(function (closedQaItems) {
      var closedSubroutine = require('./src/modules/closedIssuesSubroutine')
      closedSubroutine(closedQaItems, function () {
        console.log('ALL CLOSED ASANA PROMISES RESOLVED'.green)
        resolve()
      }, DRYRUN)
    }, {
      state: 'closed',
      limit: 50,
      since: offsetLastRun
    })
  })
}

function runOpen () {
  return new Promise(function (resolve, reject) {
    gitIssues(function (openQaItems) {
      var openSubroutine = require('./src/modules/openIssuesSubroutine')
      openSubroutine(openQaItems, function () {
        console.log('ALL OPEN ASANA PROMISES RESOLVED'.green)
        if (!DRYRUN) {
          updateLastRun()
        }
      }, DRYRUN)
    }, {
      state: 'open',
      limit: 150 // ,
      // pageLimit: 3
    })
  })
}
