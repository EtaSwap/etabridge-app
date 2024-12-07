import React from 'react';
import {Link} from 'react-router-dom';
import {IWallet, IWallets} from "../../models";

function Header({wallet, wallets, evmWallet, evmWallets, disconnectWallet, disconnectEvmWallet, setWalletModalOpen, setEvmWalletModalOpen}: {
    wallet: IWallet;
    wallets: IWallets;
    evmWallet: IWallet;
    evmWallets: IWallets;
    disconnectWallet: any;
    disconnectEvmWallet: any;
    setWalletModalOpen: any;
    setEvmWalletModalOpen: any;
}) {
    return (
        <header className="appheader">
            <div className="container">
                <div className="appheader__wrapper">
                    <div className="appheader__logo">
                        <img src="/logo-color.svg" alt="EtaSwap" className="logo"/>
                    </div>
                    <menu className="appheader__menu">
                        <li className="appheader__menu-item">
                            <Link className={'appheader__menu-link'} to='/'>Bridge</Link>
                        </li>
                        <li className="appheader__menu-item">
                            <Link className={'appheader__menu-link'} to='/transactions'>Latest transactions</Link>
                        </li>
                    </menu>
                    <div className="appheader__button">
                        {!!wallet?.address
                            ? <>
                                <img src={wallets[wallet.name].icon} className='appheader__client'
                                     alt={wallets[wallet.name].title}/>
                                <span className="appheader__address">{wallet?.address}</span>
                                <button
                                    className="button button&#45;&#45;small"
                                    title="Logout"
                                    onClick={() => disconnectWallet(wallet.name)}
                                >
                                    <svg className="appheader__logout">
                                        <use href="#icon&#45;&#45;logout" xlinkHref="#icon&#45;&#45;logout"></use>
                                    </svg>
                                </button>
                            </>
                            : <button className="button button--small" onClick={() => setWalletModalOpen(true)}>
                                Connect wallet
                            </button>
                        }
                        {!!evmWallet?.address
                            ? <>
                                <img src={evmWallets[evmWallet.name].icon} className='appheader__client'
                                     alt={evmWallets[evmWallet.name].title}/>
                                <span className="appheader__address">{evmWallet?.address.substring(0, 5)}...{evmWallet?.address.substring(36)}</span>
                                <button
                                    className="button button&#45;&#45;small"
                                    title="Logout"
                                    onClick={() => disconnectEvmWallet(evmWallet.name)}
                                >
                                    <svg className="appheader__logout">
                                        <use href="#icon&#45;&#45;logout" xlinkHref="#icon&#45;&#45;logout"></use>
                                    </svg>
                                </button>
                            </>
                            : <button className="button button--small" onClick={() => setEvmWalletModalOpen(true)}>
                                Connect EVM wallet
                            </button>
                        }
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header
