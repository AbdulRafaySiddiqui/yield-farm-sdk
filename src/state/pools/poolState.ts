import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Provider } from "@ethersproject/providers";
import fetchPools from "./fetchPools";
import { PoolState } from "../../config/types";
import {
    CARD_HANDLER_ADDRESS,
    CARD_HANDLER_ADDRESS_V1,
    FARM_ADDRESS,
    FARM_ADDRESS_V1,
    PROJECT_HANDLER_ADDRESS,
    PROJECT_HANDLER_ADDRESS_V1,
} from "../../config";

const initialState: PoolState = {
    loadingV1: false,
    loadingV2: false,
    farmDataV1: [],
    farmDataV2: [],
};

export const loadV1Pools = createAsyncThunk(
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
                FARM_ADDRESS_V1,
                CARD_HANDLER_ADDRESS_V1,
                PROJECT_HANDLER_ADDRESS_V1
            );
            return _pools;
        } catch (e) {
            console.log(e);
        }
    }
);

export const loadV2Pools = createAsyncThunk(
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
    },
});

export default poolSlice.reducer;
