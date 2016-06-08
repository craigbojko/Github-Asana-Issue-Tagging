var ids = {
  size: {
    tiny: 23111907371143,
    small: 21991496525384,
    medium: 21991496525382,
    large: 21991496525380,
    huge: 23111907371141
  },
  urgent: 21991496525375,
  qa: {
    'queued': 21991496525371,
    'awaiting-revision': 21991496525366,
    'awaiting-feedback': 21991496525368,
    'CS:QA:Queued': 21991496525371,
    'CS:QA:Awaiting Revision': 21991496525366,
    'CS:QA:Awaiting Feedback': 21991496525368
  },
  types: {
    testing: 23112768738706,
    feedback: 21991496525396,
    tagging: 21991496525386,
    uv: 23112768738721,
    setup: 23112768738711
  }
}

var labels = {
  size: {},
  qa: {},
  types: {}
}

labels.size[ids.size.tiny] = 'Tiny'
labels.size[ids.size.small] = 'Small'
labels.size[ids.size.medium] = 'Medium'
labels.size[ids.size.large] = 'Large'
labels.size[ids.size.huge] = 'Huge'
labels[ids.urgent] = 'Urgent'

labels.qa[ids.qa.queued] = 'queued'
labels.qa[ids.qa['awaiting-revision']] = 'awaiting-revision'
labels.qa[ids.qa['awaiting-feedback']] = 'awaiting-feedback'

labels.qa['queued'] = 'CS:QA:Queued'
labels.qa['awaiting-feedback'] = 'CS:QA:Awaiting Feedback'
labels.qa['awaiting-revision'] = 'CS:QA:Awaiting Revision'

labels.types[ids.types.testing] = 'Testing'
labels.types[ids.types.tagging] = 'Tagging'
labels.types[ids.types.feedback] = 'Exit Feedback'
labels.types[ids.types.uv] = 'Universal Variable'
labels.types[ids.types.setup] = 'Client Setup'

module.exports = {
  ids: ids,
  labels: labels
}
