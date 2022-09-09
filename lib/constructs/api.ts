import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";

import {
  EndpointType,
  LambdaIntegration,
  LambdaIntegrationOptions,
  Model,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export type RestApiConstructProps = {
  certificate: ICertificate;
  domain: string;
  hostedZone: route53.IHostedZone;
};

export class RestApiConstruct extends Construct {
  private readonly api: RestApi;

  constructor(
    scope: Construct,
    id: string,
    { certificate, domain, hostedZone }: RestApiConstructProps
  ) {
    super(scope, id);

    this.api = new RestApi(this, "api", {
      restApiName: "hst-coingecko-api",
      description: `HeadStarter Coingecko Circulating Supply API`,
      endpointConfiguration: {
        types: [EndpointType.REGIONAL],
      },
      domainName: {
        certificate,
        domainName: domain,
      },
      disableExecuteApiEndpoint: true,
      cloudWatchRole: false,
    });
    this.wireUpRoute53(hostedZone, domain);
  }

  public registerEndpointForLambdaIntegration(
    verb: string,
    path: string | null,
    handler: IFunction,
    opts?: LambdaIntegrationOptions
  ) {
    const resx = this.api.root.resourceForPath(!path ? "/" : path);
    const lambdaIntegration = new LambdaIntegration(handler, opts);

    resx.addMethod(verb, lambdaIntegration, {
      methodResponses: [
        {
          statusCode: "200",
          responseModels: {
            "application/json": Model.EMPTY_MODEL,
          },
        },
      ],
    });
  }

  private wireUpRoute53(hostedZone: route53.IHostedZone, domain: string) {
    new route53.ARecord(this, `HS-CoinGeckoAPI-AliasRecordFor-${domain}`, {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(this.api)),
      recordName: domain,
    });
  }
}
