#!/usr/bin/env node

import chalk from "chalk";
import inquirer from "inquirer";
import chalkAnimation from "chalk-animation";
import { execSync } from "child_process";
import columnify from "columnify";
let portName;
let currentProccesses = [];
let pidIndexAll = false;
let pidIndexes = [];

async function welcome() {
  console.log(chalk.blue("Port Killer CLI \n"));
}

async function finish() {
  console.log(`${chalk.blue("\nExiting...")}`);
}

async function killPIDs() {
  if (pidIndexAll || pidIndexes.length > 0) {
    const rainbowTitle = chalkAnimation.rainbow("Killing ports... \n");
    rainbowTitle.stop();

    if (pidIndexAll) {
      currentProccesses.forEach((process) => {
        const pid = process.pid;
        execSync(`kill -9 ${pid}`);
        console.log(`Killed PID: ${pid}`);
      });
    } else if (pidIndexes.length > 1) {
      pidIndexes.forEach((pidIndex) => {
        const pid = currentProccesses[pidIndex]?.pid;
        if (pid) {
          execSync(`kill -9 ${pid}`);
          console.log(`Killed PID: ${pid}`);
        } else {
          console.log(`Process index [${pidIndexes[0]}] not found.`);
        }
      });
    } else if (pidIndexes.length == 1) {
      const pid = currentProccesses[pidIndexes[0]]?.pid;
      if (pid) {
        execSync(`kill -9 ${pid}`);
        console.log(`Killed PID: ${pid}`);
      } else {
        console.log(`Process index [${pidIndexes[0]}] not found.`);
      }
    }
  } else {
    console.log(chalk.red(" \nNo ports to kill!"));
  }
}

async function askPort() {
  const answers = await inquirer.prompt({
    name: "port_name",
    type: "input",
    message: "Search by port:",
    default() {
      return "Default: 3000";
    },
  });

  portName = answers.port_name || 3000;
}

async function getPorts() {
  try {
    const stdout = execSync(`lsof -i :${portName}`);
    const data = [];
    const processes = [];

    stdout
      .toString()
      .split("\n")
      .forEach((line) => {
        if (line.trim() !== "") {
          processes.push(line.replace(/\s+/g, " ").trim());
        }
      });

    processes.shift();

    processes.forEach((process, i) => {
      const processInfo = process.split(" ");
      const index = i;
      const name = processInfo[0];
      const pid = processInfo[1];
      const user = processInfo[2];

      data.push({
        index,
        name,
        pid,
        user,
      });
    });

    const uniqueResults = [
      ...new Map(data.map((process) => [process.pid, process])).values(),
    ];

    uniqueResults.forEach((process, i) => {
      const index = i;
      uniqueResults[i].index = index;
    });

    currentProccesses = uniqueResults;

    var columns = columnify(uniqueResults, {
      columns: ["index", "name", "pid", "user"],
      minWidth: 20,
      columnSplitter: " | ",
      headingTransform: function (heading) {
        return `${chalk.blue(heading[0].toUpperCase() + heading.slice(1))}`;
      },
      config: {
        pid: {
          maxWidth: 40,
          headingTransform: function (heading) {
            return `${chalk.blue(heading.toUpperCase())}`;
          },
        },
        name: {},
        index: {
          dataTransform: function (data) {
            return `[${data.toLowerCase()}]`;
          },
        },
      },
    });

    console.log(``);

    console.log(columns);

    console.log(``);

    const answers = await inquirer.prompt({
      name: "pid_indexes",
      type: "input",
      message: "Hunt by the index:",
      default() {
        return "0 or 1,3,4 or all";
      },
    });

    console.log(``);

    if (answers.pid_indexes === "all") {
      pidIndexAll = true;
    } else if (answers.pid_indexes.includes(",")) {
      const tmpAnswers = answers.pid_indexes.split(",");
      tmpAnswers.forEach((pidIndex) => {
        pidIndexes.push(parseInt(pidIndex));
      });
    } else {
      pidIndexes.push(parseInt(answers.pid_indexes));
    }
  } catch (err) {}
}

console.clear();
await welcome();
await askPort();
await getPorts();
await killPIDs();
await finish();
