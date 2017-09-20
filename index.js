const {promisify} = require('util');
const {join} = require('path');
const {Transform, Writable} = require('stream');
const minimist = require('minimist');
const AWS = require('aws-sdk');
const Kinesis = require('aws-sdk/clients/kinesis');
const KinesisReadable = require('kinesis-readable');

const providerChain = new AWS.CredentialProviderChain();
providerChain.providers.push(() => {
  return new AWS.Credentials('undefined', 'undefined');
});

const createKinesisReadables = async ({kinesisEndpoint, kinesisStream}) => {
  const client = new Kinesis({
    apiVersion: '2013-12-02',
    credentialProvider: providerChain,
    endpoint: kinesisEndpoint,
    region: 'eu-west-1',
    params: {StreamName: 'bricklane-central-development'}
  });

  const {StreamDescription: {Shards}} = await promisify((...args) =>
    client.describeStream(...args)
  )({});

  const readables = Shards.map(({ShardId: shardId}) =>
    KinesisReadable(client, {shardId, iterator: 'TRIM_HORIZON'})
  );

  return readables;
};

const transformRecordToEvent = (records, encoding, cb) => {
  const event = {
    Records: records.map(({SequenceNumber, ApproximateArrivalTimestamp, PartitionKey, Data}) => ({
      eventID: `shardId-000:${SequenceNumber}`,
      eventVersion: '1.0',
      kinesis: {
        approximateArrivalTimestamp: Math.round(
          new Date(ApproximateArrivalTimestamp).getTime() / 1000
        ),
        partitionKey: PartitionKey,
        data: Data.toString('base64'),
        kinesisSchemaVersion: '1.0',
        sequenceNumber: SequenceNumber
      },
      invokeIdentityArn: 'arn:aws:iam::EXAMPLE',
      eventName: 'aws:kinesis:record',
      eventSourceARN: 'arn:aws:kinesis:EXAMPLE',
      eventSource: 'aws:kinesis',
      awsRegion: 'eu-west-1'
    }))
  };
  cb(null, event);
};

const processEvent = lambda => (event, encoding, callback) => {
  lambda(event, {}, callback);
};

const executeLambda = async (readablesP, lambda) => {
  const readables = await Promise.resolve(readablesP);

  readables.forEach(readable => {
    readable
      .pipe(
        new Transform({
          objectMode: true,
          transform: transformRecordToEvent
        })
      )
      .pipe(
        new Writable({
          objectMode: true,
          write: processEvent(lambda)
        })
      );
  });
};

const start = ({lambdaFile, lambdaHandler, kinesisEndpoint, kinesisStream}) => {
  const lambda = require(join(process.cwd(), lambdaFile))[lambdaHandler];

  const readablesP = createKinesisReadables({kinesisEndpoint, kinesisStream});

  executeLambda(readablesP, lambda);

  return () => {
    return readablesP.then(readables => readables.forEach(readable => readable.close()));
  };
};

module.exports = {
  start
};

if (!process.parent) {
  const argv = minimist(process.argv.slice(2));

  const {
    'lambda-file': lambdaFile,
    'lambda-handler': lambdaHandler,
    'kinesis-endpoint': kinesisEndpoint,
    'kinesis-stream': kinesisStream
  } = argv;

  const close = start({lambdaFile, lambdaHandler, kinesisEndpoint, kinesisStream});

  process.on('SIGTERM', close);
}
