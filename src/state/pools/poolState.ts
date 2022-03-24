import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Provider } from "@ethersproject/providers";
import fetchPools from "./fetchPools";
import { PoolState } from "../../config/types";
import {
    CARD_HANDLER_ADDRESS_V2,
    CARD_HANDLER_ADDRESS_V1,
    FARM_ADDRESS_V2,
    FARM_ADDRESS_V1,
    PROJECT_HANDLER_ADDRESS_V2,
    PROJECT_HANDLER_ADDRESS_V1,
    FARM_ADDRESS,
    PROJECT_HANDLER_ADDRESS,
    CARD_HANDLER_ADDRESS,
} from "../../config";

const initialState: PoolState = {
    loadingV1: false,
    loadingV2: false,
    loading: false,
    farmDataV1: [],
    farmDataV2: [],
    farmData: [],
};

export const loadV1Pools = createAsyncThunk(
    "pools/loadPoolsV1",
    async (
        payload: {
            ethersProvider: Provider;
            projectId: number;
            account: string;
        },
        thunkApi
    ) => {
        try {
            const { ethersProvider, projectId, account } = payload;
            console.log(FARM_ADDRESS_V1, CARD_HANDLER_ADDRESS_V1, PROJECT_HANDLER_ADDRESS_V1);
            const _pools = await fetchPools(
                ethersProvider,
                projectId,
                account,
                FARM_ADDRESS_V1,
                PROJECT_HANDLER_ADDRESS_V1,
                CARD_HANDLER_ADDRESS_V1
            );
            return _pools;
        } catch (e) {
            console.log(e);
        }
    }
);

export const loadV2Pools = createAsyncThunk(
    "pools/loadPoolsV2",
    async (
        payload: {
            ethersProvider: Provider;
            projectId: number;
            account: string;
        },
        thunkApi
    ) => {
        try {
            const { ethersProvider, projectId, account } = payload;
            const _pools = await fetchPools(
                ethersProvider,
                projectId,
                account,
                FARM_ADDRESS_V2,
                PROJECT_HANDLER_ADDRESS_V2,
                CARD_HANDLER_ADDRESS_V2
            );
            return _pools;
        } catch (e) {
            console.log(e);
        }
    }
);

export const loadPools = createAsyncThunk(
    "pools/loadPools",
    async (
        payload: {
            ethersProvider: Provider;
            projectId: number;
            account: string;
        },
        thunkApi
    ) => {
        try {
            const { ethersProvider, projectId, account } = payload;
            const _pools = await fetchPools(
                ethersProvider,
                projectId,
                account,
                FARM_ADDRESS,
                PROJECT_HANDLER_ADDRESS,
                CARD_HANDLER_ADDRESS
            );
            return _pools;
        } catch (e) {
            console.log(e);
        }
    }
);

const poolSlice = createSlice({
    name: "pools",
    reducers: {},
    initialState: initialState,
    extraReducers: (builder) => {
        // V1
        builder.addCase(loadV1Pools.pending, (state) => {
            state.loadingV1 = true;
        });
        builder.addCase(loadV1Pools.rejected, (state) => {
            state.loadingV1 = false;
        });
        builder.addCase(loadV1Pools.fulfilled, (state, action: any) => {
            state.farmDataV1 = action.payload?.pools;
            state.loadingV1 = false;
        });

        // V2
        builder.addCase(loadV2Pools.pending, (state) => {
            state.loadingV2 = true;
        });
        builder.addCase(loadV2Pools.rejected, (state) => {
            state.loadingV2 = false;
        });
        builder.addCase(loadV2Pools.fulfilled, (state, action: any) => {
            state.farmDataV2 = action.payload?.pools;
            state.loadingV2 = false;
        });

        // main
        builder.addCase(loadPools.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(loadPools.rejected, (state) => {
            state.loading = false;
        });
        builder.addCase(loadPools.fulfilled, (state, action: any) => {
            state.farmData = action.payload?.pools;
            state.loading = false;
        });
    },
});

export default poolSlice.reducer;
