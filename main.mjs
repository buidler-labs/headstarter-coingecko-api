import express from 'express';
import fetch from 'node-fetch';

const SERVER_PORT = process.env.SERVER_PORT || 3000;
const MIN_REFRESH_INTERVAL_MS = process.env.MIN_REFRESH_INTERVAL_MS || 60000;

const TOKEN_ADDRESS = "0.0.968069";
const MAX_SUPPLY = 2500000000;
const DECIMALS_COUNT = 8;

const TOKEN_DISTRIBUTION_ACCOUNT = "0.0.968012";
const TEAM_ADVISORS_ACCOUNT = "0.0.968013";
const LIQUIDITY_FUND_ACCOUNT = "0.0.968014";
const TREASURY_ACCOUNT = "0.0.968016";
const RESERVES_ACCOUNT = "0.0.968017";
const STAKING_REWARD_SUBSIDIES_ACCOUNT = "0.0.968019";
const IDO_ROUND1_CONTRACT_ID = "0.0.1006289";
const IDO_ROUND2_CONTRACT_ID = "0.0.1032556";
const IDO_MAIN_ROUND_CONTRACT_ID = "0.0.1053185";
const HST_ACCOUNTS = [
    TOKEN_DISTRIBUTION_ACCOUNT,
    TEAM_ADVISORS_ACCOUNT,
    LIQUIDITY_FUND_ACCOUNT,
    TREASURY_ACCOUNT,
    RESERVES_ACCOUNT,
    STAKING_REWARD_SUBSIDIES_ACCOUNT
];
const HST_IDO_CONTRACTS = [
    IDO_ROUND1_CONTRACT_ID,
    IDO_ROUND2_CONTRACT_ID,
    IDO_MAIN_ROUND_CONTRACT_ID
];

const app = express();

let circulatingSupply = null;
let lastCheckedDate = null;

app.get('/v0/circulating-supply', async (req, res) => {
    let shouldRefresh = !lastCheckedDate || new Date().getTime() - lastCheckedDate > MIN_REFRESH_INTERVAL_MS;

    if (!circulatingSupply || shouldRefresh) {
        lastCheckedDate = new Date().getTime();
        console.info(`Updating supply info at ${lastCheckedDate}`);
        const totalNonDistributedTokens = await getSupplyNonDistributedTokens() + await getIDONonDistributedTokens();

        circulatingSupply = MAX_SUPPLY - totalNonDistributedTokens;
        console.info(`Done. Current circulating HST supply is ${circulatingSupply}`);
    }
    res.status(200).send(`${circulatingSupply}`);
});

app.listen(SERVER_PORT, () => {
    console.log(`HST Circulating Supply API has started serving on port ${SERVER_PORT}`);
});

async function getSupplyNonDistributedTokens() {
    return await safelyGetAllHstTokensFor(HST_ACCOUNTS);
}

async function getIDONonDistributedTokens() {
    return await safelyGetAllHstTokensFor(HST_IDO_CONTRACTS);
}

async function safelyGetAllHstTokensFor(accounts) {
    let totalTokensInAccounts = 0;

    try {
        for (const accountId of accounts) {
            totalTokensInAccounts += await getHSTBalanceFor(accountId);
        }
    } catch (e) {
        console.error(`There was an issue while querying Hedera's Mirror for Held Account info: ${e.message}`);
    }
    return totalTokensInAccounts;
}

async function getHSTBalanceFor(accountId) {
    const rawMirrorInfo = await fetch(`https://mainnet-public.mirrornode.hedera.com/api/v1/balances?account.id=${accountId}`);
    const mirrorInfo = await rawMirrorInfo.json();

    for (const balanceInfo of mirrorInfo.balances) {
        if (balanceInfo.account === accountId) {
            for (const tokenInfo of balanceInfo.tokens) {
                if (tokenInfo.token_id === TOKEN_ADDRESS) {
                    const decimaledBalance = tokenInfo.balance / Math.pow(10, DECIMALS_COUNT);
                    
                    console.debug(`Account ${accountId} has balance of ${decimaledBalance} HST`);
                    return decimaledBalance;
                }
            }
        }
    }
}