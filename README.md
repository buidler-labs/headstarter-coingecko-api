## About

Outputs the current-circulating supply of [HeadStarter](http://headstarter.org/)'s [HST token](https://hashscan.io/#/mainnet/token/968069) on [Hedera](https://hedera.com/).
It is primarily being [used by Coingecko](https://www.coingecko.com/en/coins/headstarter).

## Running locally

This service can only be run following a successful deployment on AWS via `npm run cdk:deploy`, for instance.

Please make sure you have your `.env` properly set by following the `.env.sample` info.

The resulting address will be `https://<API_DOMAIN>/v0/circulating-supply`.

## License

MIT
