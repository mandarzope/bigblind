import { readdirSync, lstatSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { green, red, blue, magenta, yellow, bgRed } from 'colors/safe';
import { createStack, ReadTemplate } from './stack';
const log = console.log;

const seeds = resolve('src', 'seeds');
const seedStacks = (BaseArgs, ...otherArgs) => readdirSync(seeds)
    .filter(i => lstatSync(join(seeds, i))
        .isFile()
        && i.match(/^.*.ts/)
    ).map(temp => {
        const {
            ProjectName
        } = BaseArgs;
        const FileName = temp.replace(/[^A-z]/gi, '');
        const StackName = ProjectName + FileName;
        log(green('Checking stack: ' + StackName));
        return ReadTemplate(join(seeds, temp), BaseArgs, ...otherArgs)
            .then((TemplateBody) => {
                return createStack({
                    StackName,
                    TemplateBody,
                    Capabilities: ['CAPABILITY_NAMED_IAM']
                })
            }).then((d) => ({
                [FileName]: StackName
            }))
    });
export const BuildSeed = (BaseArgs, ...args) => Promise.all(seedStacks(BaseArgs, ...args)).then((Seeds) => Seeds.reduce((a, b) => {
    return Object.assign(a, b)
}, {}));