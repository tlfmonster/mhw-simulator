import * as data from '~/app/data'
import { Skill } from '../hooks/useSkill'

export interface Result {
  head: string | undefined
  body: string | undefined
  arm: string | undefined
  wst: string | undefined
  leg: string | undefined
  charm: string | undefined
  deco: { name: string, count: number }[]
}

let _worker: Worker | undefined

const createWorker = () => {
  // 2重実行しないよう、前回のワーカーを終了させる
  // TODO: 実行が完了している場合、前回のものを使い回すようにする
  if (_worker) _worker.terminate()

  return _worker = new Worker('~/worker/index.js')
}

const find = <T>(list: string[], obj: Record<string, T>) =>
  list.map(value => obj[value]).find(Boolean)

export default async (skill: Skill) =>
  new Promise<Result>(resolve => {
    const worker = createWorker()

    worker.postMessage({
      action: 'load',
      data: Object.keys(skill).map(key => `${key} >= ${skill[key]}`).join('\n'),
      mip: true,
    })

    worker.addEventListener('message', (e) => {
      const { action, result } = e.data

      if (action !== 'done') return

      const list = Object.keys(result).filter(key => result[key])

      const head = find(list, data.head)
      const body = find(list, data.body)
      const arm = find(list, data.arm)
      const wst = find(list, data.wst)
      const leg = find(list, data.leg)
      const charm = find(list, data.charm)

      const deco = list
        .map(value => ({ name: data.deco[value], count: result[value] }))
        .filter(({ name }) => name)

      resolve({ head, body, arm, wst, leg, charm, deco })
    })
  })
