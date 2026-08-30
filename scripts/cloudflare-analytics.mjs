#!/usr/bin/env node

const ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";
const DEFAULT_DAYS = 30;
const MAX_DAYS = 90;

function usage() {
  return `Usage: node scripts/cloudflare-analytics.mjs [--days N] [--json]

Required environment variables:
  CF_ACCOUNT_ID  Cloudflare account ID
  CF_SITE_TAG    Web Analytics site tag (normally the beacon token)
  CF_API_TOKEN   API token with Account Analytics: Read permission

Examples:
  node scripts/cloudflare-analytics.mjs
  node scripts/cloudflare-analytics.mjs --days 7
  node scripts/cloudflare-analytics.mjs --days 30 --json`;
}

function parseArguments(argv) {
  let days = DEFAULT_DAYS;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--json") {
      json = true;
      continue;
    }

    if (argument === "--days") {
      const value = Number.parseInt(argv[index + 1], 10);
      if (!Number.isInteger(value) || value < 1 || value > MAX_DAYS) {
        throw new Error(`--days must be an integer from 1 to ${MAX_DAYS}.`);
      }
      days = value;
      index += 1;
      continue;
    }

    if (argument === "--help" || argument === "-h") {
      console.log(usage());
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return { days, json };
}

function requireEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}.\n\n${usage()}`);
  }
  return value;
}

function escapeGraphQL(value) {
  return JSON.stringify(value);
}

function buildQuery({ accountId, siteTag, start, end, topLimit, dayLimit }) {
  const filter = `{
    AND: [
      { datetime_geq: ${escapeGraphQL(start)}, datetime_lt: ${escapeGraphQL(end)} }
      { siteTag: ${escapeGraphQL(siteTag)} }
      { bot: 0 }
    ]
  }`;

  return `query NR5GWebsiteAnalytics {
    viewer {
      accounts(filter: { accountTag: ${escapeGraphQL(accountId)} }) {
        totals: rumPageloadEventsAdaptiveGroups(
          filter: ${filter}
          limit: 1
        ) {
          count
          sum { visits }
        }
        daily: rumPageloadEventsAdaptiveGroups(
          filter: ${filter}
          limit: ${dayLimit}
          orderBy: [date_ASC]
        ) {
          count
          sum { visits }
          dimensions { date }
        }
        pages: rumPageloadEventsAdaptiveGroups(
          filter: ${filter}
          limit: ${topLimit}
          orderBy: [count_DESC]
        ) {
          count
          sum { visits }
          dimensions { requestPath }
        }
        referrers: rumPageloadEventsAdaptiveGroups(
          filter: ${filter}
          limit: ${topLimit}
          orderBy: [count_DESC]
        ) {
          count
          sum { visits }
          dimensions { refererHost }
        }
        countries: rumPageloadEventsAdaptiveGroups(
          filter: ${filter}
          limit: ${topLimit}
          orderBy: [count_DESC]
        ) {
          count
          sum { visits }
          dimensions { countryName }
        }
        devices: rumPageloadEventsAdaptiveGroups(
          filter: ${filter}
          limit: ${topLimit}
          orderBy: [count_DESC]
        ) {
          count
          sum { visits }
          dimensions { deviceType }
        }
      }
    }
  }`;
}

function number(value) {
  return Number.isFinite(value) ? value : 0;
}

function metric(group) {
  return {
    pageViews: number(group?.count),
    visits: number(group?.sum?.visits),
  };
}

function ranked(groups, dimension, emptyLabel = "Unknown") {
  return (groups ?? []).map((group) => ({
    name: group?.dimensions?.[dimension] || emptyLabel,
    ...metric(group),
  }));
}

function normalize(account, metadata) {
  const totals = metric(account.totals?.[0]);

  return {
    ...metadata,
    totals: {
      ...totals,
      pagesPerVisit: totals.visits > 0
        ? Number((totals.pageViews / totals.visits).toFixed(2))
        : 0,
    },
    daily: ranked(account.daily, "date"),
    topPages: ranked(account.pages, "requestPath"),
    topReferrers: ranked(account.referrers, "refererHost", "Direct / none"),
    topCountries: ranked(account.countries, "countryName"),
    deviceTypes: ranked(account.devices, "deviceType"),
  };
}

function markdownTable(rows, firstColumn) {
  if (rows.length === 0) {
    return "No data for this period.";
  }

  const heading = `| ${firstColumn} | Page views | Visits |`;
  const divider = "|---|---:|---:|";
  const body = rows.map((row) => {
    const name = String(row.name).replaceAll("|", "\\|");
    return `| ${name} | ${row.pageViews.toLocaleString("en-US")} | ${row.visits.toLocaleString("en-US")} |`;
  });

  return [heading, divider, ...body].join("\n");
}

function renderMarkdown(report) {
  const totals = report.totals;

  return `# NR5G visitor analytics

Period: ${report.start.slice(0, 10)} through ${report.end.slice(0, 10)} (${report.days} days, UTC)

- Page views: **${totals.pageViews.toLocaleString("en-US")}**
- Visits: **${totals.visits.toLocaleString("en-US")}**
- Pages per visit: **${totals.pagesPerVisit.toLocaleString("en-US")}**

Cloudflare Web Analytics uses adaptive sampling, so values should be treated as estimates rather than billing-grade counts.

## Daily trend

${markdownTable(report.daily, "Date")}

## Top pages

${markdownTable(report.topPages, "Path")}

## Referrers

${markdownTable(report.topReferrers, "Referrer")}

## Countries

${markdownTable(report.topCountries, "Country")}

## Devices

${markdownTable(report.deviceTypes, "Device")}
`;
}

async function main() {
  const { days, json } = parseArguments(process.argv.slice(2));
  const accountId = requireEnvironment("CF_ACCOUNT_ID");
  const siteTag = requireEnvironment("CF_SITE_TAG");
  const apiToken = requireEnvironment("CF_API_TOKEN");
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  const start = startDate.toISOString();
  const end = endDate.toISOString();
  const query = buildQuery({
    accountId,
    siteTag,
    start,
    end,
    topLimit: 10,
    dayLimit: Math.min(days + 1, MAX_DAYS + 1),
  });

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Cloudflare returned HTTP ${response.status}. Check the API token and account ID.`);
  }
  if (!payload) {
    throw new Error("Cloudflare returned a response that was not JSON.");
  }
  if (payload.errors?.length) {
    const messages = payload.errors.map((error) => error.message).join("; ");
    throw new Error(`Cloudflare GraphQL error: ${messages}`);
  }

  const account = payload.data?.viewer?.accounts?.[0];
  if (!account) {
    throw new Error("No matching Cloudflare account was returned. Check CF_ACCOUNT_ID and API-token access.");
  }

  const report = normalize(account, {
    generatedAt: new Date().toISOString(),
    days,
    start,
    end,
  });

  console.log(json ? JSON.stringify(report, null, 2) : renderMarkdown(report));
}

main().catch((error) => {
  console.error(`Analytics report failed: ${error.message}`);
  process.exitCode = 1;
});
