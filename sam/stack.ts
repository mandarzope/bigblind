import { CloudFormation, S3 } from 'aws-sdk';
import { green, red, blue, magenta, yellow, bgRed } from 'colors/safe';
import { join, parse, resolve } from 'path';
import { createReadStream } from 'fs';
const log = console.log;

const accessKeyId = 'AKIATHZAMXO5KLI246MC';
const secretAccessKey = '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';

const CF = new CloudFormation({
    accessKeyId,
    secretAccessKey,
    region: "us-east-1"
})
const Storage = new S3({
    accessKeyId,
    secretAccessKey,
    // region: "us-east-1"
})
function ifStackExist({
    StackName,
}) {
    return new Promise(function (resolve, reject) {
        CF.describeStacks({
            StackName
        }, function (e, d) {
            if (e) {
                if (e.code == 'ValidationError'
                    && e.message == `Stack with id ${StackName} does not exist`) {
                    resolve(false)
                } else {
                    reject(e)
                }
            } else {
                resolve(true)
            }
        })
    })
}
export function createStack({
    StackName,
    TemplateBody,
    Capabilities = null
}) {
    let exists;
    return ifStackExist({
        StackName
    }).then((d) => {
        if (d) {
            exists = true;
            log(bgRed('Stack exists: ' + StackName));
        } else {
            log(bgRed('Stack doesn\'t exist: ' + StackName));
        }
        if (exists) {
            log(yellow('Updating stack: ' + StackName));
            return CF.updateStack({
                StackName,
                Capabilities,
                TemplateBody: JSON.stringify(TemplateBody)
            }).promise()
        } else {
            log(yellow('Creating stack: ' + StackName));
            return CF.createStack({
                StackName,
                TemplateBody: JSON.stringify(TemplateBody),
                Capabilities
            }).promise()
        }
    }).then((d) => {
        if (exists) {
            log(yellow('Waiting for update: ' + StackName));
            return CF.waitFor('stackUpdateComplete', {
                StackName
            }).promise()
        } else {
            log(yellow('Waiting for create: ' + StackName));
            return CF.waitFor('stackCreateComplete', {
                StackName
            }).promise()
        }
    }).catch((e) => {
        console.log('error', e)
        return null;
    })
}

export function ReadTemplate(path, ...args) {
    return import(path)
        .then((file) => {
            const TemplateBody = (typeof file.default == 'function')
                ? file.default(...args) : file.default;
            return TemplateBody;
        })
}

export function UploadZip(BaseArgs) {
    const {
        FilePath,
        S3Bucket,
        ProjectName
    } = BaseArgs;
    const FilePaths: string[] = FilePath.split('/');
    const FileName = FilePaths.pop();
    const FunctionName = FilePaths.pop();
    FilePaths.pop();
    const Stack = FilePaths.pop();
    const StackName = ProjectName + Stack.replace(/[^A-z]/g, '');
    const ts = new Date().valueOf().toString()
    const Key = `${StackName}/${FunctionName}/${ts}.zip`;
    return Storage.upload({
        Bucket: S3Bucket,
        Key,
        Body: createReadStream(resolve(FilePath))
    }).promise()
        .then((d) => ({
            FilePath, Key
        }))
}