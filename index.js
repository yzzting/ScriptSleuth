#!/usr/bin/env node
"use strict";
/**
 * ScriptSleuth CLI Tool
 *
 * This tool allows users to interactively select and run scripts
 * from a package.json file within a Node.js project.
 *
 * @author ZenYang
 * @date 2024/1/25
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = require("node:fs");
const node_child_process_1 = require("node:child_process");
const commander_1 = require("commander");
const prompts_1 = require("@inquirer/prompts");
const program = new commander_1.Command();
let prefix = 'npm'; // Default script prefix
const scripts = {};
/**
 * Retrieves package information from the local package.json file.
 *
 * @returns {Promise<{version: string; description: string}>} Package version and description.
 */
async function getPackageInfo() {
    const pkg = JSON.parse(await node_fs_1.promises.readFile(node_path_1.default.join(__dirname, './package.json'), 'utf-8'));
    return {
        version: pkg.version,
        description: pkg.description
    };
}
/**
 * Checks if package.json exists in the current working directory and reads the scripts.
 *
 * @returns {Promise<boolean>} True if package.json exists and is readable, false otherwise.
 */
async function hasPackageJson() {
    const packageJsonPath = node_path_1.default.join(process.cwd(), 'package.json');
    try {
        await node_fs_1.promises.access(packageJsonPath);
        const packageJson = JSON.parse(await node_fs_1.promises.readFile(packageJsonPath, 'utf-8'));
        Object.assign(scripts, packageJson.scripts);
        return true;
    }
    catch (e) {
        return false;
    }
}
/**
 * Prompts the user to select a script to run from the available scripts in package.json.
 */
async function getScriptName() {
    const options = program.opts();
    if (options.prefix) {
        prefix = options.prefix;
        // Log the change only when a new prefix is provided.
        console.log(`Using ${prefix} to run scripts`);
    }
    // Transform scripts into an array suitable for the inquirer prompt.
    const scriptChoices = Object.keys(scripts).map((key) => ({
        value: key,
        name: `${key}: ${scripts[key]}`
    }));
    // Create a prompt for user to choose a script.
    const scriptPrompt = {
        message: 'Which script would you like to run?',
        choices: scriptChoices
    };
    try {
        const answer = await (0, prompts_1.select)(scriptPrompt);
        runScript(answer);
    }
    catch {
        process.exit(1);
    }
}
/**
 * Spawns a child process to run the selected script using the specified prefix.
 *
 * @param {string} scriptName - The name of the script to run.
 */
function runScript(scriptName) {
    if (scriptName === '') {
        console.log('No script name provided');
        process.exit(1);
    }
    const command = `${prefix} run ${scriptName}`;
    console.log(`Running ${command}`);
    const [cmd, ...args] = command.split(' ');
    const child = (0, node_child_process_1.spawn)(cmd, args, { stdio: 'inherit' });
    child.on('exit', (code) => {
        process.exit(code === 0 ? 0 : 1);
    });
}
// Self-executing function to use async/await at the top level.
void (async () => {
    try {
        const { version, description } = await getPackageInfo();
        program
            .name('ScriptSleuth')
            .version(version)
            .description(description)
            .option('-p, --prefix <prefix>', 'The prefix to use for the script command', '')
            .action(async () => {
            if (!(await hasPackageJson())) {
                console.log('No package.json found');
                process.exit(1);
            }
            await getScriptName();
        });
        // If no arguments are provided, display the help text.
        if (process.argv.length < 2) {
            program.help();
        }
        else {
            program.parse(process.argv);
        }
    }
    catch (error) {
        process.exit(1);
    }
})();
