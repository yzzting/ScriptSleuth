/**
 * @Author: ZenYang
 * @Date: 2024/1/26 15:26
 */
const { exec} = require('child_process')
const pkg = require('./package.json')

describe('scriptSleuth', () => {
  test('display version', done => {
    exec('node ./index.js -V', (err, stdout, stderr) => {
      if (err) {
        console.error(err)
        return
      }
      console.log(stdout)
      expect(stdout).toContain(pkg.version)

      done()
    })
  })
})
