var GitHubApi = require('github')
var GitConfig = require('../../config')
var issueModel = require('../models/issueModel')
require('colors')

var completeCallback
var allIssues = []
var page = 1

var github = new GitHubApi({
  version: '3.0.0',
  // debug: true,
  protocol: 'https',
  timeout: 5000
})

github.authenticate({
  type: 'basic',
  username: GitConfig.github.username,
  password: GitConfig.github.token
})

function getQaIssues (config, cb) {
  var pageNum = config.page || 1
  var state = config.state || 'open'
  var limit = config.limit || 100
  var since = config.since

  var req = {
    user: 'qubitdigital',
    repo: 'cse-code-review',
    state: state,
    per_page: limit,
    page: pageNum,
    labels: 'Growth' // Limit to Growth pod for testing
  }

  if (since) {
    req.since = since
  }

  github.issues.repoIssues(req, function (err, data) {
    if (err) {
      console.error(err)
      return []
    } else {
      cb(data)
    }
  })
}

function complete () {
  var count = 0
  var parsedIssues = []

  for (var i = 0; i < allIssues.length; i++) {
    for (var j = 0; j < allIssues[i].length; j++) {
      count++
      parsedIssues.push(issueModel(allIssues[i][j]))
    }
  }
  console.log('NUMBER OF ISSUES: '.yellow, count)
  completeCallback(parsedIssues)
}

function issuePageRequest (page, dataBuffer, cb, config) {
  config.page = page
  getQaIssues(config, function (newData) {
    dataBuffer.splice(dataBuffer.length, newData.length, newData)
    cb(newData, dataBuffer, config)
  })
}

function issuePageResponse (newData, oldData, config) {
  if ((newData.length === config.limit || newData.length === 100) && page < config.pageLimit) {
    issuePageRequest(++page, allIssues, issuePageResponse, config)
  } else {
    complete()
    return
  }
}

module.exports = function (callback, config) {
  completeCallback = callback
  allIssues = []
  page = 1

  issuePageRequest(page, allIssues, issuePageResponse, config)
}
