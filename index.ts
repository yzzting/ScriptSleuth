/**
 * @Author: ZenYang
 * @Date: 2024/1/25 17:02
 */
import path from 'node:path'
import fs from 'node:fs'
import { Command } from 'commander'
import { select } from '@inquirer/prompts'

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

/**
 * @description: check current directory has package.json
 * @return boolean
 */
function hasPackageJson(): boolean {
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  try {
    fs.accessSync(packageJsonPath, fs.constants.F_OK)
    return true
  } catch (e) {
    return false
  }
}

// transform scripts to array for inquirer { value: string, name: string }
const scriptChoices = Object.keys(scripts).map((key) => ({
  value: key,
  name: `${key}: ${scripts[key]}`
}))

// create a prompt for the user to choose a script
const scriptPrompt = {
  message: 'Which script would you like to run?',
  choices: scriptChoices
}

/**
 * @description: Use the prompt to get the script name
 * @return void
 */
async function getScriptName(){
  const selectScript = await select(scriptPrompt)
  console.log(selectScript)
}

program
  .name('ScriptSleuth')
  .version(version)
  .description(description)
  .action(() => {
    if (!hasPackageJson()) {
      console.log('No package.json found')
      process.exit(1)
    }
    getScriptName()
  })

program.parse(process.argv)

if (!process.argv.length) {
  program.help()
}
