import axios from "axios";
import { getTimeframeRange } from "../utils";

const BASE_URL = "http://localhost:4000/api";

async function customTimeframeTest() {
  console.log("🔧 Custom Timeframe Test");
  console.log("=".repeat(50));

  // Test specific timeframes you're interested in
  const customTimeframes: any = ["1h", "24h", "7d", "allTime"];

  for (const timeframe of customTimeframes) {
    console.log(`\n⏱️  Testing Timeframe: ${timeframe}`);
    const { from, to } = getTimeframeRange(timeframe);
    console.log(`   📅 From: ${from.toLocaleString()}`);
    console.log(`   📅 To: ${to.toLocaleString()}`);

    const endpoints = [
      "/staking/deposits",
      "/staking/withdraws",
      "/dashboard/stakeds",
      "/dashboard/wbtc-deposits",
      "/dashboard/hbtc-issuance",
    ];

    for (const endpoint of endpoints) {
      try {
        const url = `${BASE_URL}${endpoint}?timeframe=${timeframe}&limit=3`;
        const response = await axios.get(url);

        console.log(`   📊 ${endpoint.split("/").pop()?.toUpperCase()}:`);

        if (response.data.total_deposits_btc) {
          console.log(
            `      💰 Total Deposits: ${response.data.total_deposits_btc} BTC`
          );
        }
        if (response.data.total_withdraws_btc) {
          console.log(
            `      💰 Total Withdraws: ${response.data.total_withdraws_btc} BTC`
          );
        }
        if (response.data.total_staked_btc) {
          console.log(
            `      💰 Total Staked: ${response.data.total_staked_btc} BTC`
          );
        }
        if (response.data.total_minted_btc) {
          console.log(
            `      💰 Total Minted: ${response.data.total_minted_btc} BTC`
          );
        }
        if (response.data.total_btc) {
          console.log(`      💰 Total: ${response.data.total_btc} BTC`);
        }

        if (response.data.count !== undefined) {
          console.log(`      📈 Count: ${response.data.count}`);
        }

        if (response.data.deposits) {
          console.log(
            `      📥 Sample deposits: ${response.data.deposits.length}`
          );
          if (response.data.deposits.length > 0) {
            console.log(
              `      📋 First deposit: ${response.data.deposits[0].tx_hash.substring(
                0,
                16
              )}...`
            );
          }
        }
        if (response.data.withdraws) {
          console.log(
            `      📤 Sample withdraws: ${response.data.withdraws.length}`
          );
        }
        if (response.data.stakeds) {
          console.log(
            `      🏦 Sample staked: ${response.data.stakeds.length}`
          );
          if (response.data.stakeds.length > 0) {
            console.log(`      👤 User: ${response.data.stakeds[0].user}`);
          }
        }
      } catch (error: any) {
        console.log(`   ❌ ${endpoint}: ${error.message}`);
        if (error.response?.data?.error) {
          console.log(`      Error details: ${error.response.data.error}`);
        }
      }
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📅 Testing Custom Date Ranges");

  const customRanges = [
    { start: "2025-12-01", end: "2025-12-10", name: "December 1-10" },
    { start: "2025-12-05", end: "2025-12-06", name: "December 5-6" },
  ];

  for (const range of customRanges) {
    console.log(`\n📅 ${range.name}:`);

    // Test multiple endpoints for each date range
    const dateRangeEndpoints = [
      { path: "/staking/deposits", name: "Deposits" },
      { path: "/staking/stakeds", name: "Staked" },
      { path: "/staking/withdraws", name: "Withdraws" },
    ];

    for (const endpoint of dateRangeEndpoints) {
      try {
        const url = `${BASE_URL}${endpoint.path}?startTime=${range.start}T00:00:00Z&endTime=${range.end}T23:59:59Z`;
        const response = await axios.get(url);

        console.log(`   ${endpoint.name}:`);

        let totalField = "";
        if (endpoint.path.includes("deposits"))
          totalField = "total_deposits_btc";
        else if (endpoint.path.includes("stakeds"))
          totalField = "total_staked_btc";
        else if (endpoint.path.includes("withdraws"))
          totalField = "total_withdraws_btc";

        if (response.data[totalField]) {
          console.log(`      💰 Total: ${response.data[totalField]} BTC`);
        }

        console.log(`      📈 Count: ${response.data.count || "0"}`);

        let dataField = "";
        if (endpoint.path.includes("deposits")) dataField = "deposits";
        else if (endpoint.path.includes("stakeds")) dataField = "stakeds";
        else if (endpoint.path.includes("withdraws")) dataField = "withdraws";

        if (response.data[dataField] && response.data[dataField].length > 0) {
          const data = response.data[dataField];
          console.log(`      📅 First: ${data[0].timestamp}`);
          console.log(`      📅 Last: ${data[data.length - 1].timestamp}`);

          if (data[0].user || data[0].sender) {
            const address = data[0].user || data[0].sender;
            console.log(`      👤 Sample address: ${address}`);
          }
        }
      } catch (error: any) {
        console.log(`   ❌ ${endpoint.name} Error: ${error.message}`);
      }
    }
  }
}
customTimeframeTest().catch(console.error)