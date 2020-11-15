import * as github from '@actions/github'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import send from '../src/slack'
import {readFileSync} from 'fs'

const url = 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX'
const jobName = 'Build and Test'
const jobStatus = 'Success'
const jobSteps = {}
const channel = '@override'

// mock github context
const dump = JSON.parse(readFileSync('./__tests__/fixtures/workflow_dispatch.json', 'utf-8'))

github.context.payload = dump.event
github.context.eventName = dump.event_name
github.context.sha = dump.sha
github.context.ref = dump.ref
github.context.workflow = dump.workflow
github.context.action = dump.action
github.context.actor = dump.actor

process.env.CI = 'true'
process.env.GITHUB_WORKFLOW = 'manual-test'
process.env.GITHUB_JOB = 'build'
process.env.GITHUB_RUN_ID = '360767681'
process.env.GITHUB_RUN_NUMBER = '6'
process.env.GITHUB_ACTION = 'self2'
process.env.GITHUB_ACTIONS = 'true'
process.env.GITHUB_ACTOR = 'satterly'
process.env.GITHUB_REPOSITORY = 'act10ns/slack'
process.env.GITHUB_EVENT_NAME = 'workflow_dispatch'
process.env.GITHUB_EVENT_PATH = '/home/runner/work/_temp/_github_workflow/event.json'
process.env.GITHUB_WORKSPACE = '/home/runner/work/slack/slack'
process.env.GITHUB_SHA = 'f4c103c8121b97a235791468fd31ce98e89a5e9e'
process.env.GITHUB_REF = 'refs/heads/master'
process.env.GITHUB_HEAD_REF = ''
process.env.GITHUB_BASE_REF = ''
process.env.GITHUB_SERVER_URL = 'https://github.com'
process.env.GITHUB_API_URL = 'https://github.com'
process.env.GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql'

test('workflow_dispatch event to slack', async () => {
  const mockAxios = new MockAdapter(axios, {delayResponse: 200})

  mockAxios
    .onPost()
    .reply(config => {
      console.log(config.data)
      return [200, {status: 'ok'}]
    })
    .onAny()
    .reply(500)

  const res = await send(url, jobName, jobStatus, jobSteps, channel)
  await expect(res).toStrictEqual({text: {status: 'ok'}})

  expect(mockAxios.history.post[0].data).toBe(
    JSON.stringify({
      username: 'GitHub Action',
      icon_url: 'https://octodex.github.com/images/original.png',
      channel: '@override',
      attachments: [
        {
          fallback: '[GitHub]: [act10ns/slack] build-test workflow_dispatch opened Success',
          color: 'good',
          author_name: 'satterly',
          author_link: 'https://github.com/satterly',
          author_icon: 'https://avatars0.githubusercontent.com/u/615057?v=4',
          mrkdwn_in: ['text'],
          text:
            '*<https://github.com/act10ns/slack/actions/runs/360703544|Workflow _build-test_ job _Build and Test_ triggered by _pull_request_ is _Success_>* for <https://github.com/act10ns/slack/pull/17|`#17`>\n<https://github.com/act10ns/slack/pull/17/files|`rename-to-slack`> - Rename to slack',
          fields: [],
          footer: '<https://github.com/act10ns/slack|act10ns/slack> #760',
          footer_icon: 'https://github.githubassets.com/favicon.ico',
          ts: '1589447073000'
        }
      ]
    })
  )

  mockAxios.resetHistory()
  mockAxios.reset()
})