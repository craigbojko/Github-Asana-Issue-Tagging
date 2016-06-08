var _ = require('lodash')
var moment = require('moment')
var config = require('../../config')

module.exports = function (issue) {
  var issueModel = {}
  issueModel.title = issue.title
  var titleParts = (issue && issue.title && issue.title.indexOf('-') > -1) ? issue.title.split(' - ') : issue.title || 'Title not found'
  issueModel.test_id = titleParts[1] || titleParts || null
  issueModel.client_name = titleParts[0] || titleParts || null
  issueModel.user = issue.user.login
  // issueModel.pod = (function () {
  //   for (var key in config.pods) {
  //     if (_.contains(config.pods[key], issue.user.login)) {
  //       return key
  //     }
  //   }
  // })()

  issueModel.created_at = new Date(issue.created_at).getTime()
  issueModel.updated_at = new Date(issue.updated_at).getTime()
  issueModel.created_at_text = moment(issueModel.created_at).fromNow()
  issueModel.updated_at_text = moment(issueModel.updated_at).fromNow()
  // issueModel.urgent = !!_.findWhere(issue.labels, {
  //   name: 'Urgent'
  // })
  issueModel.asana_link = issue.body.match(/https?:\/\/app.asana.com\/([0-9a-z].*)/i) && issue.body.match(/https?:\/\/app.asana.com\/([0-9a-z].*)/i)[0] || null
  issueModel.dashboard_link = issue.body.match(/https?:\/\/dashboard.qubitproducts.com\/([0-9a-z].*)/i) && issue.body.match(/https?:\/\/dashboard.qubitproducts.com\/([0-9a-z].*)/i)[0] || null
  issueModel.issue_link = issue.html_url
  issueModel.status = (function () {
    if (issue && issue.assignee && issue.user && issue.assignee.id && issue.user.id === issue.assignee.id) return 'awaiting-revision'
    if (issue && issue.assignee && issue.user && issue.assignee.id && issue.user.id !== issue.assignee.id) return 'awaiting-feedback'
    return 'queued'
  })()
  issueModel.body = issue.body

  // Add comments data
  issueModel.comments = issue.comments_url
  issueModel.comment_number = issue.comments
  issueModel.git_issue_id = issue.number

  issueModel.milestone = issue.milestone
  issueModel.labels = issue.labels

  issueModel.author = issue.user.login
  issueModel.assignee = (issue && issue.assignee && issue.assignee.login) || null
  // issueModel.rawDebug = issue

  return issueModel
}
