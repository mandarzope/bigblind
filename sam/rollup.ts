import { rollup as rollupCore, InputOptions, OutputOptions } from 'rollup';
import { parse } from 'path';
const alias = require('rollup-plugin-alias');
const typescript = require('rollup-plugin-typescript');

async function buildOne({ inputPath, outputPath }) {
    const inputOptions: InputOptions = {
        input: inputPath,
        external: ['request'],
        plugins: [
            alias({
                "@templates": "./sam/templates/index.ts"
            }),
            typescript({
                exclude: /node_modules/i,
            })
        ]
    };
    const outputOptions: OutputOptions = {
        // file: outputPath,
        dir: outputPath,
        format: 'cjs'
    };
    const bundle = await rollupCore(inputOptions);
    // console.log(bundle.watchFiles); // an array of file names this bundle depends on
    const { output } = await bundle.generate(outputOptions);
    await bundle.write(outputOptions);
    return { outputPath, inputPath }
}

function rollup(fileNames: string[]) {
    const output = [];
    for (let fileName of fileNames) {
        let { dir } = parse(fileName);
        dir = dir.replace('src/', 'build/')
        output.push(
            buildOne({
                inputPath: fileName,
                outputPath: dir
            })
        )
    }
    return Promise.all(output);
}

export default rollup;