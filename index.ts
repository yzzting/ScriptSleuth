/**
 * @Author: ZenYang
 * @Date: 2024/1/25 17:02
 */
import { Command } from 'commander'

const program = new Command()

interface IScript {
  [key: string]: string
}

/**
 * @description: read package.json version description script
 * @return { string, string, IScript }
 */
function getPackageInfo(): { version: string, description: string, scripts: IScript } {
  const pkg = require('./package.json')
  return {
    version: pkg.version,
    description: pkg.description,
    scripts: pkg.scripts
  }
}

const { version, description, scripts } = getPackageInfo()

program
  .name('ScriptSleuth')
  .version(version)
  .description(description)
  .action(() => {
    console.log(scripts)
  })

program.parse(process.argv)

if (!process.argv.length) {
  program.help()
}
