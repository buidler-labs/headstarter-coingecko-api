#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ApiStack } from "../lib/stacks/api-stack";

console.log("Checking environment sanity ...");
if (!process.env.API_CERTIFICATE_ARN) {
  console.warn("No API Certificate ARN specified");
} else {
  console.log(`Using API Certificate ARN: ${process.env.API_CERTIFICATE_ARN}`);
}
if (!process.env.API_DOMAIN) {
  console.warn("No API domain name specified");
} else {
  console.log(`Using API domain name: ${process.env.API_DOMAIN}`);
}
console.log("Done");

const GLOBAL_CDK_TAGS = {
  project: "headstarter",
  subproject: "coingecko",
};
const CDK_STACK_ENV = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();

new ApiStack(app, "hst-coingecko-api-stack", {
  env: CDK_STACK_ENV,
  stackName: "hst-coingecko-api-stack",
  tags: GLOBAL_CDK_TAGS,

  // Custom params
  domainCertificate: process.env.API_CERTIFICATE_ARN!,
  domainName: process.env.API_DOMAIN!,
});
