import * as route53 from "aws-cdk-lib/aws-route53";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";

import { RestApiConstruct } from "../constructs/api";

export type ApiStackProps = StackProps & {
  domainName: string;
  domainCertificate: string;
};

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { domainName, domainCertificate } = props;
    const certificate = Certificate.fromCertificateArn(
      this,
      "APICertificate",
      domainCertificate
    );
    const hostedZone = route53.HostedZone.fromLookup(
      this,
      `HSCG-API-HostedZone-${domainName}`,
      { domainName: this.getDomainNameFrom(domainName) }
    );
    const api = new RestApiConstruct(this, "CoingeckoHSTRestApi", {
      certificate,
      domain: domainName,
      hostedZone,
    });
    const circulatingSupplyFunction = new Function(
      this,
      "hscg-circulating-supply-lambda",
      {
        runtime: Runtime.NODEJS_16_X,
        code: Code.fromAsset("./circulating-supply-lambda"),
        handler: "index.handler",
      }
    );

    api.registerEndpointForLambdaIntegration(
      "GET",
      "/v0/circulating-supply",
      circulatingSupplyFunction
    );
  }

  private getDomainNameFrom(domain: string) {
    const domainMatch = /[\.]?(\w+)\.(\w+)$/gm.exec(domain);

    return domainMatch?.length === 3
      ? `${domainMatch[1]}.${domainMatch[2]}`
      : "acme.com";
  }
}
