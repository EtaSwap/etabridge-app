import React, { useEffect, useState } from 'react';
import Header from "./components/Header/Header";
import axios from 'axios';
import { ContractId } from '@hashgraph/sdk';
import { ethers } from 'ethers';
// @ts-ignore
import HederaLogo from './assets/img/hedera-logo.png';
// @ts-ignore
import HashpackLogo from './assets/img/hashpack.svg';
// @ts-ignore
import HashpackIcon from './assets/img/hashpack-icon.png';
// @ts-ignore
import BladeLogo from './assets/img/blade.svg';
// @ts-ignore
import BladeIcon from './assets/img/blade-icon.webp';
// @ts-ignore
import WalletConnectLogo from './assets/img/wallet-connect.svg';
// @ts-ignore
import WalletConnectIcon from './assets/img/wallet-connect-icon.svg';
// @ts-ignore
import KabilaLogo from './assets/img/kabila-logo.svg';
// @ts-ignore
import KabilaIcon from './assets/img/kabila-icon.svg';
// @ts-ignore
import MetamaskLogo from './assets/img/metamask-logo.svg';
// @ts-ignore
import MetamaskIcon from './assets/img/metamask-icon.svg';
import { BladeWallet } from './class/wallet/blade-wallet';
import Social from './components/Social/Social';
import { LoaderProvider } from "./components/Loader/LoaderContext";
import { useToaster } from "./components/Toaster/ToasterContext";
import { IWallet, IWallets, typeWallet } from "./models";
import AppRouter from "./router";
import { Token } from './types/token';
import { GetToken, HeliSwapGetToken, HSuiteGetToken, } from './class/providers/types/tokens';
import {API, MIRRORNODE, NETWORK, TOKENS_LIST, WHBAR_LIST} from './config';
import { toastTypes } from './models/Toast';
import { AggregatorId } from './class/providers/types/props';
import {ConnectWalletModal} from "./components/Header/components/ConnectWalletModal";
import Version from "./components/Version/Version";
import {WalletConnect} from "./class/wallet/wallet-connect";
import {Metamask} from "./class/evm-wallet/metamask";
import {TokenConfig} from "./models/TokenConfig";

const walletConnect = new WalletConnect();

function App() {
    const [wallet, setWallet] = useState<IWallet>({
        name: '',
        address: '',
        signer: null,
    });
    const [evmWallet, setEvmWallet] = useState<IWallet>({
        name: '',
        address: '',
        signer: null,
    });
    const [tokens] = useState<TokenConfig[]>(TOKENS_LIST);
    const [rate, setRate] = useState<number | null>(null);
    const [walletModalOpen, setWalletModalOpen] = useState(false);
    const [evmWalletModalOpen, setEvmWalletModalOpen] = useState(false);

    const [wallets, setWallets] = useState<IWallets>({
        blade: {
            name: 'blade',
            title: 'Blade',
            instance: new BladeWallet(setWallet),
            image: BladeLogo,
            icon: BladeIcon,
    }});
    const [evmWallets, setEvmWallets] = useState<IWallets>({
        metamask: {
            name: 'metamask',
            title: 'Metamask',
            instance: new Metamask(setEvmWallet),
            image: MetamaskLogo,
            icon: MetamaskIcon,
        }});

    const disconnectWallet = (name: string) => {
        wallets[name].instance.disconnect();
    }

    const disconnectEvmWallet = (name: string) => {
        evmWallets[name].instance.disconnect();
    }

    const connectWallet = (name: string) => {
        if (wallet.address) {
            if (wallet.name === name) {
                return null;
            }
            wallets[wallet.name].instance.disconnect();
        }
        wallets[name].instance.connect(false, wallets[name].extensionId);
        setWalletModalOpen(false);
    }

    const connectEvmWallet = (name: string) => {
        if (evmWallet.address) {
            if (evmWallet.name === name) {
                return null;
            }
            evmWallets[evmWallet.name].instance.disconnect();
        }
        evmWallets[name].instance.connect(false, evmWallets[name].extensionId);
        setEvmWalletModalOpen(false);
    }

    useEffect(() => {
        if(wallet.address && wallets?.[wallet.name]?.instance?.updateBalance){
            wallets[wallet.name].instance.updateBalance();
        }
    }, [wallet.address]);

    useEffect(() => {
        if(evmWallet.address && evmWallets?.[evmWallet.name]?.instance?.updateBalance){
            evmWallets[evmWallet.name].instance.updateBalance();
        }
    }, [evmWallet.address]);

    useEffect(() => {
        walletConnect.init(setWallet).then(extensionData => {
            const walletConnectWallets: IWallets = {};
            extensionData.forEach(extension => {
                if (extension.id === 'cnoepnljjcacmnjnopbhjelpmfokpijm') {
                    walletConnectWallets.kabila = {
                        name: 'kabila',
                        title: extension.name || 'Kabila',
                        instance: walletConnect,
                        image: KabilaLogo,
                        icon: KabilaIcon,
                        extensionId: extension.id,
                    };
                }
                if (extension.id === 'gjagmgiddbbciopjhllkdnddhcglnemk') {
                    walletConnectWallets.hashpack = {
                        name: 'hashpack',
                        title: extension.name || 'HashPack',
                        instance: walletConnect,
                        image: HashpackLogo,
                        icon: HashpackIcon,
                        extensionId: extension.id,
                    };
                }
            });
            walletConnectWallets.walletConnect = {
                name: 'walletConnect',
                title: 'WalletConnect',
                instance: walletConnect,
                image: WalletConnectLogo,
                icon: WalletConnectIcon,
            };
            setWallets({
                ...walletConnectWallets,
                ...wallets,
            });
            setEvmWallets(evmWallets);
        });
    }, []);

    return (
        <>
            <LoaderProvider>
                <Header
                    wallet={wallet}
                    wallets={wallets}
                    evmWallet={evmWallet}
                    evmWallets={evmWallets}
                    setWalletModalOpen={setWalletModalOpen}
                    setEvmWalletModalOpen={setEvmWalletModalOpen}
                    disconnectWallet={disconnectWallet}
                    disconnectEvmWallet={disconnectEvmWallet}
                />
                <main className="main">
                    <AppRouter
                        wallet={wallet}
                        evmWallet={evmWallet}
                        tokens={tokens}
                        rate={rate}
                        setWalletModalOpen={setWalletModalOpen}
                        setEvmWalletModalOpen={setEvmWalletModalOpen}
                    />
                </main>
                <ConnectWalletModal
                    connectWallet={connectWallet}
                    walletModalOpen={walletModalOpen}
                    wallets={wallets}
                    setWalletModalOpen={setWalletModalOpen}
                />
                <ConnectWalletModal
                    connectWallet={connectEvmWallet}
                    walletModalOpen={evmWalletModalOpen}
                    wallets={evmWallets}
                    setWalletModalOpen={setEvmWalletModalOpen}
                />
            </LoaderProvider>
            <Social/>
            <Version/>
        </>
    )
}

export default App;
