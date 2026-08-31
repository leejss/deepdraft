import chalk from 'chalk';
import ora, { type Ora } from 'ora';

export class Logger {
  private spinner?: Ora;

  startStep(step: number, total: number, message: string): void {
    const prefix = chalk.cyan(`[${step}/${total}]`);
    const formatted = `${prefix} ${chalk.bold(message)}`;
    if (this.spinner) {
      this.spinner.text = formatted;
    } else {
      this.spinner = ora({
        text: formatted,
        color: 'cyan',
      }).start();
    }
  }

  updateDetail(detail: string): void {
    if (this.spinner) {
      this.spinner.text = `${this.spinner.text.split('\n')[0]}\n    ${chalk.dim(detail)}`;
    }
  }

  succeedStep(message: string): void {
    if (this.spinner) {
      this.spinner.succeed(chalk.green(message));
      this.spinner = undefined;
    } else {
      console.log(chalk.green(`✔ ${message}`));
    }
  }

  failStep(message: string): void {
    if (this.spinner) {
      this.spinner.fail(chalk.red(message));
      this.spinner = undefined;
    } else {
      console.error(chalk.red(`✖ ${message}`));
    }
  }

  info(message: string): void {
    console.log(chalk.blue('ℹ ') + message);
  }

  success(message: string): void {
    console.log(chalk.green('✔ ') + chalk.bold(message));
  }

  warn(message: string): void {
    console.log(chalk.yellow('⚠ ') + message);
  }

  error(message: string): void {
    console.error(chalk.red('✖ ') + chalk.bold(message));
  }

  log(value: unknown): void {
    const shouldRestartSpinner = this.spinner?.isSpinning ?? false;
    this.spinner?.stop();
    console.log(value);
    if (shouldRestartSpinner) {
      this.spinner?.start();
    }
  }

  box(title: string, contents: { [key: string]: string }): void {
    console.log(`\n${chalk.bold.cyan(`✨ ${title}`)}`);
    console.log(chalk.dim('─'.repeat(50)));
    for (const [key, value] of Object.entries(contents)) {
      console.log(`  ${chalk.bold(key.padEnd(14))}: ${chalk.white(value)}`);
    }
    console.log(`${chalk.dim('─'.repeat(50))}\n`);
  }
}

export const logger = new Logger();
