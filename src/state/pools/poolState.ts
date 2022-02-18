import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Provider } from "@ethersproject/providers"
import fetchPools from "./fetchPools";
import { PoolState } from "../../config/types";

const initialState: PoolState = {
    loading: false,
    data: [],
};

export const loadPools = createAsyncThunk(
    "pools/loadPools",
    async (payload: { ethersProvider: Provider, projectId: number, account: string }, thunkApi) => {
        try {
            const { ethersProvider, projectId, account } = payload
            const _pools = await fetchPools(ethersProvider, projectId, account);
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
        builder.addCase(loadPools.pending, (state) => {
            state.loading = true;
        })
        builder.addCase(loadPools.rejected, (state) => {
            state.loading = false;
        })
        builder.addCase(loadPools.fulfilled, (state, action: any) => {
            state.data = action.payload?.pools;
            state.loading = false;
        })
    },
});

export default poolSlice.reducer;