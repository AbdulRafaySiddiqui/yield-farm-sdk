# Yield Farm SDK (NFT Village Farms SDK)

A React + TypeScript SDK for interacting with NFT Village yield-farming smart contracts.
The SDK is hook-based, designed for dApps using `@react-dapp/utils`, Redux, and EVM contracts.

---

## Installation

```bash
npm install @nftvillage/farms-sdk
```

### Peer Dependencies

```txt
react
react-redux
ethers
bignumber.js
@react-dapp/utils
```

---

## Provider & Configuration

### `FarmsSdkProvider`

All hooks depend on SDK configuration provided via React context.

```tsx
import { FarmsSdkProvider } from "@nftvillage/farms-sdk";

<FarmsSdkProvider
  config={{
    provider: ethersProvider,
  }}
>
  <App />
</FarmsSdkProvider>;
```

### `FarmSdkConfig`

```ts
export type FarmSdkConfig = {
  provider?: any;
};
```

### Accessing Config

```ts
import { useConfig } from "@nftvillage/farms-sdk";

const { config, setConfig } = useConfig();
```

---

## Core Domain Types

### `TokenStandard`

Imported from `@react-dapp/utils`

```ts
enum TokenStandard {
  NONE,
  ERC20,
  ERC721,
  ERC1155,
}
```

---

### `NftDeposit`

```ts
export type NftDeposit = {
  tokenId: BigNumber;
  amount: BigNumber;
};
```

---

### `RewardInfo`

```ts
export type RewardInfo = {
  excludeFee: boolean;
  mintable: boolean;
  rewardPerBlock: BigNumber;
  token: string;
  accRewardPerShare: BigNumber;
  lastRewardBlock: BigNumber;
  paused: boolean;
  supply: BigNumber;

  details?: {
    symbol: string;
    decimals: number;
  };

  rewards?: BigNumber;
};
```

---

### `Pool`

```ts
export type Pool = {
  projectId: number;
  poolId: number;

  withdrawlFeeReliefInterval: number;
  depositFee: number;
  harvestInterval: number;

  lockDeposit: boolean;
  minDeposit: BigNumber;

  minWithdrawlFee: number;
  maxWithdrawlFee: number;

  stakedToken: string;
  stakedTokenStandard: TokenStandard;
  stakedTokenId: BigNumber;

  stakedAmount: BigNumber;
  totalShares: BigNumber;

  minRequiredCards: number;
  requiredCards: NftDeposit[];

  rewardInfo: RewardInfo[];

  stats?: {
    liquidity: BigNumber;
    apy: BigNumber[];
  };

  userInfo?: {
    amount: BigNumber;
  };

  stakedTokenDetails?: {
    symbol: string;
    decimals: number;
    balance: BigNumber;
  };

  farmApproved?: boolean;
  cardHandlerApproved?: boolean;
  stakeTokenApproved?: boolean;
};
```

---

### `DepositInfo`

```ts
export type DepositInfo = {
  projectId: number;
  poolId: number;
  amount: string;

  depositFeeCards: NftDeposit[];
  withdrawFeeCards: NftDeposit[];
  harvestCards: NftDeposit[];
  multiplierCards: NftDeposit[];
  requiredCards: NftDeposit[];

  referrer: string;
};
```

---

### `WithdrawInfo`

```ts
export type WithdrawInfo = {
  projectId: number;
  poolId: number;
  amount: string;
};
```

---

### `WithdrawMultiplierCardsInfo`

```ts
export type WithdrawMultiplierCardsInfo = {
  projectId: number;
  poolId: number;
  cards: NftDeposit[];
};
```

---

### `WithdrawHarvestCardsInfo`

```ts
export type WithdrawHarvestCardsInfo = {
  projectId: number;
  poolId: number;
  cards: NftDeposit[];
};
```

---

### `HarvestInfo`

```ts
export type HarvestInfo = {
  projectId: number;
  poolId: number;
};
```

---

### `Project`

```ts
export type Project = {
  projectId: number;
  admin: string;
  feeRecipient: string;

  adminReward: number;
  rewardFee: number;

  initialized: boolean;
  paused: boolean;

  poolCards: string;
  startBlock: number;

  pools: {
    projectId: number;
    stakedTokenStandard: number;
    stakedTokenId: BigNumber;
    stakedToken: string;
    rewardToken: string;
    stakedAmount: BigNumber;
    lockDeposit: boolean;
    minDeposit: BigNumber;
    harvestInterval: BigNumber;
    depositFee: BigNumber;
    minWithdrawlFee: BigNumber;
    maxWithdrawlFee: BigNumber;
    totalShares: BigNumber;
  }[];
};
```

---

## Contract Hooks

All contract hooks return an `ethers.Contract | undefined`.

```ts
useNftVillageChiefContract()
useNftVillageChiefContractV1()
useNftVillageChiefContractV2()

useProjectHandlerContract()
useProjectHandlerContractV1()
useProjectHandlerContractV2()

useCardHandlerContract()
useCardHandlerContractV1()
useCardHandlerContractV2()

useReferralContract()
useFeeReceiverContract(address: string)
useTimeLockContract(address: string)
```

---

## Pool Management Hooks

### `useAddPool`

```ts
const { add, txState } = useAddPool();

await add(pool: Pool);
```

- Converts BigNumber fields
- Pays `poolFee`
- Uses ProjectHandler V2

---

### `useSetPool`

```ts
const { set, txState } = useSetPool();

await set(pool: Pool);
```

---

### `useSinglePool`

```ts
const { pool, loading } = useSinglePool(projectId, poolId);
```

Fetches:

- Pool info
- Reward info
- Required cards

Direct on-chain read (not Redux).

---

## Main Interaction Hook

### `usePool(poolId, handleError?)`

```ts
const pool = usePool(poolId, (message) => console.error(message));
```

Returns `undefined` if pool not loaded.

---

### Returned Object Shape

```ts
{
  liquidity: string;
  totalStaked: string;
  stakedAmount: string;
  stakedTokenSymbol?: string;
  stakedTokenBalance: string;
  poolSharePercent: string;

  rewards: {
    apy?: string;
    rewardTokenSymbol?: string;
    rewards: string;
  }[];

  loading: boolean;

  stakedTokenApproval;
  farmApproval;
  cardHandlerApproval;

  depositInfo;
  withdrawInfo;
  harvestInfo;

  details: Pool;
}
```

---

## Transaction Hooks

### `useDeposit`

```ts
const { deposit, txPending } = useDeposit();

await deposit(stakeInfo: DepositInfo);
```

---

### `useWithdraw`

```ts
const { withdraw, withdrawMultiplierCards, withdrawHarvestCards, txPending } =
  useWithdraw();
```

---

### `useHarvest`

```ts
const { harvest, txPending } = useHarvest();

await harvest({ projectId, poolId });
```

Harvest is executed via a zero-amount deposit call.

---

## Project Hooks

### `useProjects`

```ts
const { porjectsLength } = useProjects();
```

---

### `useProject(projectId)`

```ts
const { project, loading } = useProject(projectId);
```

---

## State & Utilities

- Pool state is Redux-backed
- Uses `awaitTransaction` for TX lifecycle
- All numeric values normalized with `BigNumber`
- ERC-20 and ERC-1155 approvals handled automatically

---

## Intended Usage

This SDK is designed for:

- NFT-based yield farming
- ERC-20 + ERC-1155 staking
- Multi-version farm contracts
- Production React dApps

---
