#!/usr/bin/env node
const minimist = require('minimist');
const {start} = require('.');

if (!process.parent) {
  const argv = minimist(process.argv.slice(1));

  const {
    'lambda-file': lambdaFile,
    'lambda-handler': lambdaHandler,
    'kinesis-endpoint': kinesisEndpoint,
    'kinesis-stream': kinesisStream
  } = argv;

  const close = start({lambdaFile, lambdaHandler, kinesisEndpoint, kinesisStream});

  process.on('SIGTERM', close);
}
