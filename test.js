const crypto = require('crypto');
const Table = require('cli-table');
const readline = require('readline');
const chalk = require('chalk');

class Rules {
    constructor(rules) {
        this.moves = rules;
        this.table = new Table({
            head: ['USER\\PC -> \n v', ...rules],
            colWidths: [15, ...rules.map((rule) => rule.length + 10)]
        });
    }

    generateTable() {
        for (let i = 0; i < this.moves.length; i++) {
            let row = [this.moves[i]];
            for (let j = 0; j < this.moves.length; j++) {
                let result = '';
                if (j === i) {
                    result = 'Draw';
                } else if ((j - i + this.moves.length) % this.moves.length <= this.moves.length / 2) {
                    result = 'Win';
                } else {
                    result = 'Lose';
                }
                row.push(result);
            }
            this.table.push(row);
        }
        console.log(chalk.magenta(this.table.toString()));

        return this.table;
    }
}

class CodeGenerator {
    constructor(cryptoKey) {
        this.cryptoKey = cryptoKey;
    }

    generateHMAC(action) {
        const hmac = crypto.createHmac('sha256', this.cryptoKey);
        hmac.update(action);
        return hmac.digest('hex');
    }

    showCode(action) {
        return this.generateHMAC(action);
    }
}

class Winner {
    constructor(act) {
        this.act = act;
    }

    isWinner(userAct, machineAct) {
        const userActIndex = this.act.indexOf(userAct);
        const machineActIndex = this.act.indexOf(machineAct);
        const resultIndex = (machineActIndex - userActIndex + this.act.length) % this.act.length;

        if (resultIndex === 0) {
            return 'draw';
        } else if (resultIndex <= this.act.length / 2) {
            return 'win';
        } else {
            return 'lose';
        }
    }
}

class Game {
    constructor() {
        this.cmdData = process.argv.slice(2);
        this.cryptoKey = crypto.randomBytes(32);
        this.machineAct = this.getComputerMove();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.rules = new Rules(this.cmdData);
        this.codeGenerator = new CodeGenerator(this.cryptoKey);
        this.winner = new Winner(this.cmdData);
    }

    validation() {

        const uniqueMoves = new Set(this.cmdData);
        if (uniqueMoves.size !== this.cmdData.length) {
            console.log(chalk.bgRedBright('>>> Error: Your arguments contain similar values.'));
            process.exit(0);
        }

        if (this.cmdData.length < 3 || this.cmdData.length % 2 === 0) {
            console.log(chalk.bgRedBright('>>> Error: Please, enter at least 3 or more odd words'));
            console.log(chalk.bgRedBright('>>> Example: node test.js rock paper scissors lizard Spock'));
            process.exit(0);
        }

    }

    getComputerMove() {
        const compAct = Math.floor(Math.random() * this.cmdData.length);
        return this.cmdData[compAct];
    }

    showMenu() {
        console.log(chalk.bold.green('Available moves: '));
        this.cmdData.forEach((el, idx) => {
            console.log(chalk.yellow(` >>> ${idx + 1} - ${el}`));
        });
        console.log(chalk.blue(' >>> 0 - Exit'));
        console.log(chalk.blue(' >>> ? - Help'));
    }

    start() {
        this.validation();
        console.log(chalk.bold('>> HMAC: [' + this.codeGenerator.showCode(this.machineAct) + ']'));
        this.showMenu();

        this.rl.question(chalk.bold.cyan('Enter your action: '), (act) => {
            const userAct = parseInt(act);
            if (userAct === 0) {
                console.log(chalk.yellow('>>> Bye! Exiting the game.'));
                process.exit(0);
            } else if (userAct >= 1 && userAct <= this.cmdData.length) {
                console.log(chalk.green(' >>> Your action : [ ' + this.cmdData[userAct - 1] + ' ]'));
                console.log(chalk.green(' >>> Machine action : [ ' + this.machineAct + ' ]'));

                const userMove = this.cmdData[userAct - 1];
                const result = this.winner.isWinner(userMove, this.machineAct);
                if (result === 'draw') {
                    console.log(chalk.bgMagenta('>>> It\'s a Draw!'));
                } else if (result === 'win') {
                    console.log(chalk.bgGreenBright('>>> You Win!'));
                } else {
                    console.log(chalk.bgRedBright('>>> You Lose!'));
                }
                console.log(chalk.bold(' >>> HMAC key: [' + this.codeGenerator.showCode(userMove) + ']'));
                this.rl.close();
            } else if (act === '?') {
                this.rules.generateTable();
                this.start()
            } else {
                console.log(chalk.bgRedBright(' >>> Invalid input! Please enter a valid number from the list above.'));
                this.start()
            }
        });
    }
}

const game = new Game();
game.start();
