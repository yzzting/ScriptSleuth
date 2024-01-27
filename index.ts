#!/usr/bin/env node

/**
 * ScriptSleuth CLI Tool
 *
 * This tool allows users to interactively select and run scripts
 * from a package.json file within a Node.js project.
 *
 * @author ZenYang
 * @date 2024/1/25
 */

import path from 'node:path'
import { promises as fs } from 'node:fs'
import { spawn } from 'node:child_process'
import { Command } from 'commander'
import { select } from '@inquirer/prompts'

const program = new Command()
let prefix = 'npm' // Default script prefix
type IScript = Record<string, string>
const scripts: IScript = {}

/**
 * Retrieves package information from the local package.json file.
 *
 * @returns {Promise<{version: string; description: string}>} Package version and description.
 */
async function getPackageInfo (): Promise<{ version: string, description: string }> {
  const pkg = JSON.parse(await fs.readFile(path.join(__dirname, './package.json'), 'utf-8'))
  return {
    version: pkg.version,
    description: pkg.description
  }
}

/**
 * Checks if package.json exists in the current working directory and reads the scripts.
 *
 * @returns {Promise<boolean>} True if package.json exists and is readable, false otherwise.
 */
async function hasPackageJson (): Promise<boolean> {
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  try {
    await fs.access(packageJsonPath, fs.constants.F_OK)
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
    Object.assign(scripts, packageJson.scripts)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Prompts the user to select a script to run from the available scripts in package.json.
 */
async function getScriptName (): Promise<void> {
  const options = program.opts()
  if (options.prefix) {
    prefix = options.prefix
    // Log the change only when a new prefix is provided.
    console.log(`Using ${prefix} to run scripts`)
  }

  // Transform scripts into an array suitable for the inquirer prompt.
  const scriptChoices = Object.keys(scripts).map((key) => ({
    value: key,
    name: `${key}: ${scripts[key]}`
  }))

  // Create a prompt for user to choose a script.
  const scriptPrompt = {
    message: 'Which script would you like to run?',
    choices: scriptChoices
  }

  try {
    const answer = await select(scriptPrompt)
    runScript(answer)
  } catch {
    process.exit(1)
  }
}

/**
 * Spawns a child process to run the selected script using the specified prefix.
 *
 * @param {string} scriptName - The name of the script to run.
 */
function runScript (scriptName: string): void {
  if (scriptName === '') {
    console.log('No script name provided')
    process.exit(1)
  }
  const command = `${prefix} run ${scriptName}`
  console.log(`Running ${command}`)
  const [cmd, ...args] = command.split(' ')
  const child = spawn(cmd, args, { stdio: 'inherit' })

  child.on('exit', (code) => {
    process.exit(code === 0 ? 0 : 1)
  })
}

// Self-executing function to use async/await at the top level.
void (async () => {
  try {
    const { version, description } = await getPackageInfo()
    program
      .name('ScriptSleuth')
      .version(version)
      .description(description)
      .option('-p, --prefix <prefix>', 'The prefix to use for the script command', '')
      .action(async () => {
        if (!(await hasPackageJson())) {
          console.log('No package.json found')
          process.exit(1)
        }
        await getScriptName()
      })
    // If no arguments are provided, display the help text.
    if (process.argv.length < 2) {
      program.help()
    } else {
      program.parse(process.argv)
    }
  } catch (error) {
    process.exit(1)
  }
})()
