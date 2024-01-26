#!/usr/bin/env node

/**
 * @Author: ZenYang
 * @Date: 2024/1/25 17:02
 */

import path from 'node:path'
import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { Command } from 'commander'
import { select } from '@inquirer/prompts'

const program = new Command()

// command line prefix can pass in as an argument npm yarn pnpm or other
let prefix = 'npm'

interface IScript {
  [key: string]: string
}

/**
 * @description: read package.json version description script
 * @return { string, string }
 */
function getPackageInfo(): { version: string, description: string } {
  const pkg = require('./package.json')
  return {
    version: pkg.version,
    description: pkg.description,
  }
}

const { version, description } = getPackageInfo()

const scripts: IScript = {}

/**
 * @description: check current directory has package.json
 * @return boolean
 */
function hasPackageJson(): boolean {
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  try {
    fs.accessSync(packageJsonPath, fs.constants.F_OK)
    const packageJson = require(packageJsonPath)
    for (const key in packageJson.scripts) {
      scripts[key] = packageJson.scripts[key]
    }
    return true
  } catch (e) {
    return false
  }
}

/**
 * @description: Use the prompt to get the script name
 * @return void
 */
function getScriptName(){
  const options = program.opts()
  if (options.prefix) {
    prefix = options.prefix
    console.log(`Using ${prefix} to run scripts`)
  }

  // transform scripts to array for inquirer { value: string, name: string }
  const scriptChoices = Object.keys(scripts).map((key) => ({
    value: key,
    name: `${key}: ${scripts[key]}`
  }))

  // create a prompt for the user to choose a script
  const scriptPrompt = {
    message: 'Which script would you like to run ?',
    choices: scriptChoices
  }

  select(scriptPrompt)
    .then((answer) => {
      runScript(answer)
    })
    .catch((err) => {
      process.exit(1)
    })
}

/**
 * @param {string} scriptName
 * @description: run script
 * @return void
 */
function runScript(scriptName: string) {
  if (!scriptName) {
    console.log('No script name provided')
    process.exit(1)
  }
  const command = `${prefix} run ${scriptName}`
  console.log(`Running ${command}`)
  const [cmd, ...args] = command.split(' ')
  const child = spawn(cmd, args, { stdio: 'inherit' })
  child.on('exit', () => {
    process.exit(1)
  })
}

program
  .name('ScriptSleuth')
  .version(version)
  .description(description)
  .option('-p --prefix <prefix>', 'The prefix to use for the script command', '')
  .action(() => {
    if (!hasPackageJson()) {
      console.log('No package.json found')
      process.exit(1)
    }
    getScriptName()
  })
  .parse(process.argv)

if (!process.argv.length) {
  program.help()
}
