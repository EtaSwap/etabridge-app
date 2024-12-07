import React from 'react';
import Swap from "../pages/Swap/Swap";
import {Route, Routes} from "react-router-dom";
import {IWallet} from "../models";
import {TokenConfig} from "../models/TokenConfig";
import LatestTransactions from "../pages/LatestTransactions/LatestTransactions";

export interface IAppRouterProps{
    wallet: IWallet;
    evmWallet: IWallet;
    tokens: TokenConfig[];
    rate: number | null;
    setWalletModalOpen: any;
    setEvmWalletModalOpen: any;
}

const AppRouter = ({wallet, evmWallet, tokens, rate, setWalletModalOpen, setEvmWalletModalOpen}: IAppRouterProps) => {

    return (
        <Routes>
            <Route path="/" element={
                <Swap
                    wallet={wallet}
                    evmWallet={evmWallet}
                    tokens={tokens}
                    rate={rate}
                    setWalletModalOpen={setWalletModalOpen}
                    setEvmWalletModalOpen={setEvmWalletModalOpen}
                />
            }/>
            <Route path="/transactions" element={<LatestTransactions/>}/>
        </Routes>
    );
};

export default AppRouter;
