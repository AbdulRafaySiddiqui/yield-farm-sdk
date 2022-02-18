import { configureStore } from "@reduxjs/toolkit";
import { poolReducer } from "./index";

export default configureStore({
    devTools: process.env.NODE_ENV !== "production",
    reducer: {
        pools: poolReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});
