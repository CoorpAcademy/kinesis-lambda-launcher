#!/usr/bin/env node
const minimist = require('minimist');
const {start} = require('.');

const argv = minimist(process.argv.slice(1));

const {
  'lambda-file': lambdaFile,
  'lambda-handler': lambdaHandler,
  'kinesis-endpoint': kinesisEndpoint,
  'kinesis-stream': kinesisStream
} = argv;

let close = start({lambdaFile, lambdaHandler, kinesisEndpoint, kinesisStream});

async function relaunchLambda() {
  console.log('Closing lambda');
  await close();
  console.log('Relaunching lambda');
  close = start({lambdaFile, lambdaHandler, kinesisEndpoint, kinesisStream});
}

process.on('SIGTERM', () => close());
process.on('uncaughtException', error => {
  console.error('Uncaught exception: ', error);
  relaunchLambda();
});
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled rejection at:', p, 'reason:', reason);
  relaunchLambda();
});
