kinesis-lamdba-launcher
================

## Installation

Install it globaly with npm

```sh
npm install -g @coorpacademy/kinesis-lambda-launcher
```

then you can call it with a simple

```
kinesis-lambda-launcher [--options]
```

### Detailled options:

```
Usage: kinesis-lambda-launcher [--options]

Options:
  --kinesis-endpoint  Specify an alternative endpoint for the kinesis sdk
                                                                        [string]
  --kinesis-stream    Specify a stream name to listen                   [string]
  --lambda-file       Path of lambda file                               [string]
  --lambda-handler    Name of lambda function                           [string]

Examples:
  kinesis-lambda-launcher --kinesis-endpoint localhost:4567 --kinesis-stream bricklane-central-development --lambda-file ./lambda/functions/progression-analytics/handler.js --lambda-handler analytics
```
