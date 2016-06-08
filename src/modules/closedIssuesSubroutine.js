var tags = require('./tagIds')
var AsanaTasks = require('./asanaTasks')
var Table = require('cli-table')
var Promise = require('Promise')

module.exports = mainAppClosed

function mainAppClosed (qaItems, _continue, _dryRun) {
  var asanaTasks = AsanaTasks()
  var removals = 0
  var promsies = []

  for (var key in qaItems) {
    var exp = new RegExp(/https?:\/\/app.asana.com\/0\/[0-9]+\/([0-9]+)/i)
    var asanaId = qaItems[key] && qaItems[key].asana_link && qaItems[key].asana_link.match(exp)
    var title = qaItems[key].title

    if (asanaId && asanaId.length > 1) {
      asanaId = parseInt(asanaId[1], 10)
    } else {
      continue
    }

    for (var tag in tags.ids.qa) { // remove all
      if (!_dryRun) {
        var p1 = asanaTasks.removeTag(asanaId, tags.ids.qa[tag], title)
        promsies.push(p1)
      } else {
        var p2 = asanaTasks.dryRemoveTag(asanaId, tags.ids.qa[tag], title)
        promsies.push(p2)
      }
    }
    removals++
  }

  Promise.all(promsies).then(function () {
    var table = new Table({
      head: ['Removals'.cyan],
      colWidths: [40]
    })

    table.push(
      [removals]
    )

    asanaTasks.printRemoveTable()
    console.log(table.toString())
    _continue()
  }, function (err) {
    console.log('CLOSE PROMISES FAIL: ', err)
  })
}
