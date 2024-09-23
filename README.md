# AEM Import Builder

Powerful AI capabilities to simplify AEM import script development.

## Usage

Coming soon

## Developer Guide

Ensure you understand the [architecture](./wiki).

### Install

Install all the dependencies

```
npm i
```

### Build

This is a Typescript project so a build step is required to generate the final Javascript. 

```
npm run build
```

### Test

Run all the units tests using Mocha

```
npm run test
```

### Environment

Since this project makes Open AI requests you must be authenticated.

The following environment variables must be defined before making requests to Azure Open AI.

```
IMS_CLIENT_SECRET
IMS_AUTH_CODE
```

### Templates

Handlebars templates are used extensively but the import builder to generate scripts and AI prompts. Script templates are stored as publicly accessible GitHib gists.

- https://gist.github.com/arumsey/a66e25a5292afcc0f34be48a84c8c548
