import { Request, Response } from "express";
import prisma from "../lib/prisma";
import {
  formatKomaFromSats,
  calculateChange,
  getTimeframeRange,
  formatAddress,
} from "../utils/index";

export const getTokenOverview = async (req: Request, res: Response) => {
  try {
    const timeframe = (req.query.timeframe as string) || "24h";
    const { from, to } = getTimeframeRange(timeframe);

    // Get total supply
    const [totalMinted, totalBurned] = await Promise.all([
      prisma.mintEvent.aggregate({ _sum: { amount: true } }),
      prisma.burnEvent.aggregate({ _sum: { amount: true } }),
    ]);

    const totalSupplyKOMA = formatKomaFromSats(
      (totalMinted._sum.amount || 0n) - (totalBurned._sum.amount || 0n)
    );

    // Get timeframe activity
    const [timeframeMints, timeframeBurns, timeframeTransfers] =
      await Promise.all([
        prisma.mintEvent.aggregate({
          where: { blockTimestamp: { gte: from, lte: to } },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.burnEvent.aggregate({
          where: { blockTimestamp: { gte: from, lte: to } },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.transferEvent.aggregate({
          where: { blockTimestamp: { gte: from, lte: to } },
          _count: true,
          _sum: { amount: true },
        }),
      ]);

    // Get previous timeframe for changes
    const previousFrom = new Date(
      from.getTime() - (to.getTime() - from.getTime())
    );
    const [previousMints, previousBurns] = await Promise.all([
      prisma.mintEvent.aggregate({
        where: { blockTimestamp: { gte: previousFrom, lt: from } },
        _sum: { amount: true },
      }),
      prisma.burnEvent.aggregate({
        where: { blockTimestamp: { gte: previousFrom, lt: from } },
        _sum: { amount: true },
      }),
    ]);

    const currentMinted = formatKomaFromSats(timeframeMints._sum.amount || 0n);
    const previousMinted = formatKomaFromSats(previousMints._sum.amount || 0n);
    const mintChange = calculateChange(currentMinted, previousMinted);

    const currentBurned = formatKomaFromSats(timeframeBurns._sum.amount || 0n);
    const previousBurned = formatKomaFromSats(previousBurns._sum.amount || 0n);
    const burnChange = calculateChange(currentBurned, previousBurned);

    // Get top holders (simplified)
    const recentTransfers = await prisma.transferEvent.findMany({
      where: { blockTimestamp: { gte: from, lte: to } },
      take: 50,
      orderBy: { amount: "desc" },
    });

    const response = {
      overview: {
        total_supply: totalSupplyKOMA.toFixed(8),
        total_minted: formatKomaFromSats(totalMinted._sum.amount || 0n).toFixed(
          8
        ),
        total_burned: formatKomaFromSats(totalBurned._sum.amount || 0n).toFixed(
          8
        ),
        net_issuance: (
          formatKomaFromSats(totalMinted._sum.amount || 0n) -
          formatKomaFromSats(totalBurned._sum.amount || 0n)
        ).toFixed(8),
      },
      timeframe_activity: {
        timeframe,
        mints: {
          count: timeframeMints._count,
          amount: currentMinted.toFixed(8),
          change_pct: mintChange.toFixed(2),
        },
        burns: {
          count: timeframeBurns._count,
          amount: currentBurned.toFixed(8),
          change_pct: burnChange.toFixed(2),
        },
        transfers: {
          count: timeframeTransfers._count,
          volume: formatKomaFromSats(
            timeframeTransfers._sum.amount || 0n
          ).toFixed(8),
        },
      },
      recent_activity: {
        large_transfers: recentTransfers
          .map(
            (t: any) => ({
              from: formatAddress(t.fromAddress),
              to: formatAddress(t.toAddress),
              amount: formatKomaFromSats(t.amount).toFixed(8),
              timestamp: t.blockTimestamp.toISOString(),
            })
          )
          .slice(0, 10),
      },
      as_of: new Date().toISOString(),
      block_range: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching token overview:", error);
    res.status(500).json({ error: "Failed to fetch token overview" });
  }
};

export const getMintHistory = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const mints = await prisma.mintEvent.findMany({
      take: limit,
      skip: offset,
      orderBy: { blockTimestamp: "desc" },
      select: {
        txHash: true,
        blockNumber: true,
        blockTimestamp: true,
        toAddress: true,
        amount: true,
        minter: true,
      },
    });

    const total = await prisma.mintEvent.count();

    const response = {
      mints: mints.map(
        (mint: any) => ({
          transaction: mint.txHash,
          block: mint.blockNumber,
          timestamp: mint.blockTimestamp.toISOString(),
          to: formatAddress(mint.toAddress),
          amount: formatKomaFromSats(mint.amount).toFixed(8),
          minter: formatAddress(mint.minter),
        })
      ),
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + mints.length < total,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching mint history:", error);
    res.status(500).json({ error: "Failed to fetch mint history" });
  }
};

export const getBurnHistory = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const burns = await prisma.burnEvent.findMany({
      take: limit,
      skip: offset,
      orderBy: { blockTimestamp: "desc" },
      select: {
        txHash: true,
        blockNumber: true,
        blockTimestamp: true,
        fromAddress: true,
        amount: true,
        burner: true,
      },
    });

    const total = await prisma.burnEvent.count();

    const response = {
      burns: burns.map(
        (burn: any) => ({
          transaction: burn.txHash,
          block: burn.blockNumber,
          timestamp: burn.blockTimestamp.toISOString(),
          from: formatAddress(burn.fromAddress),
          amount: formatKomaFromSats(burn.amount).toFixed(8),
          burner: formatAddress(burn.burner),
        })
      ),
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + burns.length < total,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching burn history:", error);
    res.status(500).json({ error: "Failed to fetch burn history" });
  }
};

export const getBlacklistStatus = async (req: Request, res: Response) => {
  try {
    const [blacklisted, unblacklisted] = await Promise.all([
      prisma.blacklistedEvent.findMany({
        distinct: ["account"],
        orderBy: { blockTimestamp: "desc" },
        select: { account: true, blockTimestamp: true, blacklister: true },
      }),
      prisma.unBlacklistedEvent.findMany({
        distinct: ["account"],
        orderBy: { blockTimestamp: "desc" },
        select: { account: true, blockTimestamp: true, blacklister: true },
      }),
    ]);

    // Get currently blacklisted accounts (blacklisted but not unblacklisted)
    const blacklistedSet = new Set(
      blacklisted.map((b: { account: { toString: (arg0: string) => any } }) =>
        b.account.toString("hex")
      )
    );
    const unblacklistedSet = new Set(
      unblacklisted.map((u: { account: { toString: (arg0: string) => any } }) =>
        u.account.toString("hex")
      )
    );

    const currentlyBlacklisted = blacklisted
      .filter(
        (b: { account: { toString: (arg0: string) => unknown } }) =>
          !unblacklistedSet.has(b.account.toString("hex"))
      )
      .map(
        (b: any) => ({
          account: formatAddress(b.account),
          blacklisted_at: b.blockTimestamp.toISOString(),
          blacklisted_by: formatAddress(b.blacklister),
        })
      );

    const response = {
      currently_blacklisted: currentlyBlacklisted,
      blacklist_history: {
        total_blacklisted: blacklisted.length,
        total_unblacklisted: unblacklisted.length,
        currently_active: currentlyBlacklisted.length,
      },
      as_of: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching blacklist status:", error);
    res.status(500).json({ error: "Failed to fetch blacklist status" });
  }
};

export const getTransferHistory = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const transfers = await prisma.transferEvent.findMany({
      take: limit,
      skip: offset,
      orderBy: { blockTimestamp: "desc" },
      select: {
        txHash: true,
        blockNumber: true,
        blockTimestamp: true,
        fromAddress: true,
        toAddress: true,
        amount: true,
      },
    });

    const total = await prisma.transferEvent.count();

    const response = {
      transfers: transfers.map(
        (transfer: any) => ({
          transaction: transfer.txHash,
          block: transfer.blockNumber,
          timestamp: transfer.blockTimestamp.toISOString(),
          from: formatAddress(transfer.fromAddress),
          to: formatAddress(transfer.toAddress),
          amount: formatKomaFromSats(transfer.amount).toFixed(8),
        })
      ),
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + transfers.length < total,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching transfer history:", error);
    res.status(500).json({ error: "Failed to fetch transfer history" });
  }
};

export const getSystemHealth = async (req: Request, res: Response) => {
  try {
    const [latestBlock, totalEvents, snapshots, alerts] = await Promise.all([
      prisma.transferEvent.findFirst({
        orderBy: { blockNumber: "desc" },
        select: { blockNumber: true, blockTimestamp: true },
      }),
      Promise.all([
        prisma.mintEvent.count(),
        prisma.burnEvent.count(),
        prisma.transferEvent.count(),
      ]),
      prisma.tokenSnapshot.findFirst({
        orderBy: { snapshotTime: "desc" },
      }),
      prisma.systemAlert.findMany({
        where: { resolved: false },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const response = {
      database: {
        last_block: latestBlock?.blockNumber || 0,
        last_block_time: latestBlock?.blockTimestamp?.toISOString() || null,
        total_events: {
          mints: totalEvents[0],
          burns: totalEvents[1],
          transfers: totalEvents[2],
        },
      },
      indexer: {
        last_snapshot: snapshots?.snapshotTime.toISOString() || null,
        snapshots_count: await prisma.tokenSnapshot.count(),
      },
      alerts: alerts.map(
        (alert: {
          id: { toString: () => any };
          severity: any;
          title: any;
          description: any;
          createdAt: { toISOString: () => any };
        }) => ({
          id: alert.id.toString(),
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          created: alert.createdAt.toISOString(),
        })
      ),
      as_of: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching system health:", error);
    res.status(500).json({ error: "Failed to fetch system health" });
  }
};
