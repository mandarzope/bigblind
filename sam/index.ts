#!/bin/node
import { parse, resolve, join } from 'path';
import { execSync } from 'child_process';
import minimatch from 'minimatch';
import archiver from 'archiver';
const accessKeyId = 'AKIARMENEF6CWOKJDLEF';
const secretAccessKey = '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';
const region = "ap-south-1";
export const AWS = {
    accessKeyId,
    secretAccessKey,
    region
}


const ProjectName = parse(resolve()).name.replace(/[^A-z]/g, '');
const S3Bucket = `sam-${ProjectName}-${region}`;
const BaseArgs = {
    ProjectName,
    S3Bucket
}
const changed = execSync(`git diff-tree --no-commit-id --name-only -r HEAD`)
    .toString()
    .split('\n')
    .filter(line => line.trim().length > 0);

const functions = [], exclude = [], stacks = [];
const [a, b, ...args] = process.argv;
for (let arg of args) {
    if (arg.slice(0, 12) == '--functions=') {
        functions.push(arg.replace('--functions=', ''))
    } else if (arg.slice(0, 10) == '--exclude=') {
        exclude.push(arg.replace('--exclude=', ''))
    }
}

if (functions.length == 0) functions.push(`src/stacks/*/functions/*/*.ts`)
if (stacks.length == 0) stacks.push(`src/stacks/*`)

const FunctionsChanged = changed.filter(path => functions.map((pattern) => {
    return minimatch(path, pattern);
}).some(yesno => yesno == true) &&
    !exclude.map((pattern) => {
        return minimatch(path, pattern);
    }).some(yesno => yesno == true)).map(p => `${parse(p).dir}/index.ts`).filter((el, pos, arr) => arr.indexOf(el) == pos)

import { createWriteStream, readdirSync, lstatSync } from 'fs';
import { ReadTemplate, UploadZip, createStack } from './stack';
import { BuildSeed } from './seed';
import rollup from './rollup';


/**
 * Helpers
 */
const singleCharacter = '[A-z0-9\-\_]';
const multipleCharacter = singleCharacter + '*';

/**
 * Identify stack to update based on .ts files changed
 */

const StacksChanged = FunctionsChanged.reduce((a, i) => {
    const stackRegex = stacks.map((stack) => {
        stack = stack.split('').map((c) => {
            if (['/', '\\', '^', '.', '=', '-'].includes(c)) {
                return `\\${c}`
            } else if (c == '*') {
                return `${multipleCharacter}`
            } else {
                return c
            }
        })
        stack = `^(${stack.join('')})`
        const regex = new RegExp(stack)
        const match = regex.exec(i);
        return match[1]
    }).filter(i => !!i)

    return stackRegex.reduce((ar, ln) => {
        if (!ar.includes(ln)) ar.push(ln)
        return ar;
    }, a)
}, []);

async function ZipFiles({ Seeds }) {
    /**
     * Compile ts files
     */
    const FunctionPaths = await rollup(FunctionsChanged);
    /**
     * Zip compiled functions
     */
    const FunctionsToZip = {};
    const ZipFilesPromises = FunctionPaths.map(({
        outputPath, inputPath
    }) => {
        const ZipPath = resolve(outputPath + '.zip')
        var output = createWriteStream(ZipPath);
        var archive = archiver('zip', {
            zlib: { level: 9 }
        });
        archive.pipe(output);
        archive.directory(outputPath, false)
        return archive.finalize().then((d) => ({
            ZipPath,
            outputPath,
            inputPath
        }));
    })
    return Promise.all(ZipFilesPromises)
        .then(
            (ZipFilePaths) => Promise.all(
                ZipFilePaths.map(
                    ({ ZipPath,
                        outputPath,
                        inputPath }) => UploadZip({
                            ...BaseArgs,
                            FilePath: ZipPath
                        }).then(({ FilePath, Key }) => {
                            const InputFolder = resolve(parse(inputPath).dir)
                            return { [InputFolder]: Key }
                        })
                )
            )
        )
        .then((d) => {
            return d.reduce((a, b) => Object.assign(a, b), {})
        })
        .then((ZipFilesMap) => ({
            ZipFilesMap, Seeds
        }))
}

function ExtractStackTemplates({ StacksChanges, Seeds, ZipFilesMap }) {
    /**
     * Extract and build stack templates from sub resources
     */
    const StackTemplates = StacksChanges.map(async (stackPath) => {
        const Stack = parse(stackPath).name;
        const StackName = ProjectName + Stack.replace(/[^A-z]/g, '')
        const dir = resolve(stackPath, 'functions');
        const functions = readdirSync(dir)
            .filter(i => lstatSync(join(dir, i))
                .isDirectory()
                && !i.match(/^\./)
            )
        const StackTemplate = await ReadTemplate(resolve(stackPath, 'template.ts'), {
            ...BaseArgs,
            StackName,
            Seeds
        });
        const Resources = await functions.reduce(async (a, FunctionName) => {
            const FunctionPath = join(dir, FunctionName)
            a[`${StackName}${FunctionName}`] = await ReadTemplate(join(dir, FunctionName, 'template.ts'), {
                ...BaseArgs,
                StackName,
                Seeds,
                FunctionName,
                S3Key: ZipFilesMap[FunctionPath],
                StacksChanged
            })
            return a;
        }, {});
        StackTemplate['Resources'] = {
            ...StackTemplate['Resources'],
            ...Resources
        }
        return {
            StackName,
            StackTemplate
        }
    })
    return Promise.all(StackTemplates).then((d) => ({
        StackTemplates: d,
        Seeds, ZipFilesMap
    }))
}

// BuildSeed(BaseArgs)
Promise.resolve({})
    // BuildSeed(BaseArgs)
    .then((Seeds) => {
        // return ZipFiles({ Seeds })
        return { Seeds, ZipFilesMap: {} }
    }).then(({ Seeds, ZipFilesMap }) => {
        return ExtractStackTemplates({ StacksChanges: StacksChanged, Seeds, ZipFilesMap });
    }).then(({ StackTemplates, Seeds, ZipFilesMap }) => {
        console.log(JSON.stringify(StackTemplates))
        // StackTemplates.map(({
        //     StackName,
        //     StackTemplate
        // }) => {
        //     return createStack({
        //         StackName,
        //         TemplateBody: StackTemplate
        //     })
        // })
    })
