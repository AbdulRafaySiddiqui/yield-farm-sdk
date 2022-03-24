import React from "react";
import ReactDOM from "react-dom";
import { useAddPool, useDeposit, useHarvest, usePool, useSetPool, useWithdraw } from "./hooks/usePool";
import { usePools } from "./state/hooks";
import { toUpperUnit, useERC20Approval, useERC1155Approval, useEthers, UtilsProvider } from "@react-dapp/utils";
import { usePoolV1, usePoolV2 } from "./hooks/usePool";
import BigNumber from "bignumber.js";
import { Pool } from "./config/types";
import { usePoolsV1, usePoolsV2 } from "./state/hooks";
import { Provider } from "react-redux";
import store from "./state/store";
import { FARM_ADDRESS, POOL_CARDS_ADDRESS } from "./config";

console.warn = () => {};
require("dotenv").config();

const print = (value: any) => {
    return (
        // <details>
        <pre>{JSON.stringify(value, undefined, 1)}</pre>
        // </details>
    );
};

const getStateText = (i: number) => {
    if (i === 0) return "IDLE";
    if (i === 1) return "BUSY";
    if (i === 2) return "FAILED";
    if (i === 3) return "SUCCEED";
    return "...";
};

const StakedToken = "0xA3a237487A142B6C889bE7675bb8f1359a3C6b89";
const Elvantis = "0xA7Db6045fC72A9557854c72BB94D606Fd5a807c0";

const App = () => {
    async function requestAccount() {
        await (window as any).ethereum.request({
            method: "eth_requestAccounts",
        });
    }
    requestAccount();
    const { ethers, account } = useEthers();
    // const project = useProject(0)
    // const addPool = useAddPool()
    // const setPool = useSetPool()
    usePools();
    usePoolsV1();
    usePoolsV2();
    const pool = usePool(0);
    const pool1 = usePoolV1(0);
    // const pool = usePoolV2(0);
    // const depositHook = useDeposit()
    // const harvestHook = useHarvest()
    // const withdrawHook = useWithdraw()

    // const erc20Approval = useERC20Approval(pools[0]?.stakedToken, FARM_ADDRESS);
    // const erc1155Approval = useERC1155Approval(POOL_CARDS_ADDRESS, FARM_ADDRESS);

    console.log(pool1);
    // console.log(pool);

    const poolData: Pool = {
        projectId: 0,
        minRequiredCards: 0,
        poolId: 0,
        withdrawlFeeReliefInterval: new BigNumber(0).toNumber(),
        depositFee: new BigNumber(1000).toNumber(),
        harvestInterval: new BigNumber(0).toNumber(),
        lockDeposit: false,
        minDeposit: new BigNumber(0),
        maxWithdrawlFee: new BigNumber(0).toNumber(),
        minWithdrawlFee: new BigNumber(0).toNumber(),
        stakedToken: StakedToken,
        stakedTokenStandard: 0,
        stakedTokenId: new BigNumber(0),
        stakedAmount: new BigNumber(0),
        totalShares: new BigNumber(0),
        requiredCards: [],
        rewardInfo: [
            {
                mintable: false,
                rewardPerBlock: toUpperUnit("10"),
                token: Elvantis,
                accRewardPerShare: new BigNumber(0),
                lastRewardBlock: new BigNumber(0),
                paused: false,
                supply: new BigNumber(0),
                rewards: new BigNumber(0),
            },
        ],
    };

    return (
        <div>
            <h1>NFT Village Farm SDK</h1>

            {/* <h3>Project Info</h3>
      {loading ? 'Loading project...' : print(project)} */}

            {/* <h3>Deposit Pool</h3>
      <button onClick={() => erc20Approval.approve()}>Staked Token Approved:  {pools[0]?.stakeTokenApproved}</button>
      <button onClick={() => erc1155Approval.approve()}>Pool Cards Approved:  {pools[0]?.poolCardsApproved}</button>
      <button onClick={() => depositHook.deposit({
        projectId: 0,
        poolId: 0,
        amount: toUpperUnit('10').toFixed(0),
        depositFeeCards: [],
        harvestCards: [],
        multiplierCards: [],
        withdrawFeeCards: [],
        referrer: '0x0000000000000000000000000000000000000000'
      })}>{depositHook.txPending ? 'Pending...' : 'Deposit'}</button>

      <h3>Withdraw Pool</h3>
      <button onClick={() => withdrawHook.withdraw({ projectId: 0, poolId: 0, amount: '10000' })}>Withdraw</button>


      <h3>Harvest Pool</h3>
      <button onClick={() => harvestHook.harvest({ projectId: 0, poolId: 0 })}>Harvest</button>


      <h3>Pool Info</h3>
      {loading ? 'Loading Pool...' : print(pools[0])}

      <h3>Add Pool</h3>
      <p>{getStateText(addPool.txState)}</p>
      <button onClick={() => addPool.add(poolData)}>Add Pool</button>

      <h3>Set Pool</h3>
      <p>{getStateText(setPool.txState)}</p>
      <button onClick={() => setPool.set(poolData)}>Set Pool</button> */}
        </div>
    );
};

ReactDOM.render(
    <React.StrictMode>
        <UtilsProvider
            config={{
                provider: (window as any).ethereum,
                wrappedNative: {
                    name: "",
                    decimals: 18,
                    address: "",
                    symbol: "WBNB",
                },
                usd: {
                    name: "",
                    decimals: 18,
                    address: "",
                    symbol: "BUSD",
                },
                nativeUsdLp: {
                    name: "",
                    decimals: 18,
                    address: "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16",
                    symbol: "",
                },
            }}
        >
            <Provider store={store}>
                <App />
            </Provider>
        </UtilsProvider>
    </React.StrictMode>,
    document.getElementById("root")
);
