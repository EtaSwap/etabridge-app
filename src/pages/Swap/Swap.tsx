import {message, Popover} from 'antd'
import {useEffect, useState} from 'react'
import {BigNumber, ethers} from 'ethers';
import {
    AccountAllowanceApproveTransaction,
    ContractExecuteTransaction,
    ContractFunctionParameters, ContractId, Hbar,
    TokenId,
} from '@hashgraph/sdk';
import axios from 'axios';
import {useLoader} from "../../components/Loader/LoaderContext";
import {useToaster} from "../../components/Toaster/ToasterContext";
import {TokensModal} from "./Components/TokensModal/TokensModal";
import {toastTypes} from "../../models/Toast";
import {
    API,
    BRIDGE_ADDRESSES, BRIDGE_HEDERA_ADDRESS,
    CHAIN_LOGO_MAP,
    CHAIN_LZ_ID_MAP,
    DEFAULT_TOKENS,
    MIRRORNODE,
} from '../../config';
import AssociateNewToken from './Components/AssociateNewToken/AssociateNewToken';
// @ts-ignore
import defaultImage from "../../assets/img/default.svg";
import {TOKEN_CONFIG_CHAIN, TokenConfig} from "../../models/TokenConfig";
import {Options} from '@layerzerolabs/lz-v2-utilities';

export interface ISwapProps {
    wallet: any;
    evmWallet: any;
    tokens: TokenConfig[];
    rate: number | null;
    setWalletModalOpen: any;
    setEvmWalletModalOpen: any;
}

function Swap({wallet, evmWallet, tokens, setWalletModalOpen, setEvmWalletModalOpen}: ISwapProps) {
    const {showLoader, hideLoader, loading} = useLoader();
    const {showToast} = useToaster();

    const [tokenOneAmountInput, setTokenOneAmountInput] = useState<string>('0');
    const [tokenTwoAmountInput, setTokenTwoAmountInput] = useState<string>('0');
    const [tokenOne, setTokenOne] = useState<TokenConfig>(tokens[DEFAULT_TOKENS[0]]);
    const [tokenTwo, setTokenTwo] = useState<TokenConfig>(tokens[DEFAULT_TOKENS[1]]);
    const [tokenOneLiquidity, setTokenOneLiquidity] = useState<BigNumber>(BigNumber.from('0'));
    const [tokenTwoLiquidity, setTokenTwoLiquidity] = useState<BigNumber>(BigNumber.from('0'));

    const [associatedButtons, setAssociatedButtons] = useState<TokenConfig[]>([]);
    const [feeOnTransfer, setFeeOnTransfer] = useState<boolean>(false);
    const [messageApi, contextHolder] = message.useMessage()
    const [isTokensModalOpen, setIsTokensModalOpen] = useState(false)
    const [changeToken, setChangeToken] = useState<any>(1)
    const [searchPhrase, setSearchPhrase] = useState('');
    const [hiddenTokens, setHiddenTokens] = useState<number[]>([]);

    const changeAmountOne = (value: string) => {
        if (feeOnTransfer) {
            setFeeOnTransfer(false);
        }
        if (value.match(/^[0-9]{0,10}(?:\.[0-9]{0,8})?$/)) {
            setTokenOneAmountInput(value ? (['.', '0'].includes(value.charAt(value.length - 1)) ? value : parseFloat(value).toString()) : '0');
        }
    }

    const switchTokens = () => {
        setTokenOne(tokenTwo);
        setTokenTwo(tokenOne);
        setTokenTwoAmountInput('0');
        setTokenOneAmountInput('0');
    }

    const openTokensModal = (token: number) => {
        setChangeToken(token);
        setIsTokensModalOpen(true);
    }

    const modifyToken = (i: any) => {
        if (changeToken === 1) {
            setTokenOne(tokens[i]);
        } else {
            setTokenTwo(tokens[i]);
        }
        setIsTokensModalOpen(false);
        setSearchPhrase('');
    }

    const sendTokens = async () => {
        if (tokenOne.chain === tokenTwo.chain) {
            showToast('Can\'t swap same tokens on the same chain', '', toastTypes.error);
            return;
        }

        showLoader();
        const ETH_LZ_FEE = "200000000000000";
        const HEDERA_LZ_FEE = Hbar.fromTinybars("200000000");
        const GAS = ethers.utils.parseUnits("300000", "wei");
        const options = Options.newOptions().addExecutorLzReceiveOption(130000, 0).toBytes();
        if (tokenOne.chain === TOKEN_CONFIG_CHAIN.HEDERA) {
            try {
                const allowanceTx = await new AccountAllowanceApproveTransaction()
                    .approveTokenAllowance(
                        TokenId.fromSolidityAddress(tokenOne.address),
                        wallet?.address,
                        BRIDGE_HEDERA_ADDRESS,
                        // @ts-ignore
                        ethers.utils.parseUnits(tokenOneAmountInput, tokenOne.decimals).toString(),
                    )
                    .freezeWithSigner(wallet.signer);

                const approveTransaction = await wallet.executeTransaction(allowanceTx);
                if (approveTransaction.error) {
                    showToast('Transaction', approveTransaction.error, toastTypes.error);
                    throw approveTransaction.error;
                }

                const bridgeTransaction = await new ContractExecuteTransaction()
                    .setContractId(BRIDGE_HEDERA_ADDRESS)
                    .setGas(GAS.toNumber())
                    .setFunction('bridgeTokens', new ContractFunctionParameters()
                        .addString(tokenOne.symbol)
                        // @ts-ignore
                        .addUint256(ethers.utils.parseUnits(tokenOneAmountInput, tokenOne.decimals).toString())
                        .addAddress(evmWallet.address)
                        .addUint16(CHAIN_LZ_ID_MAP.get(tokenTwo.chain)!)
                        .addBytes(options)
                    )
                    .setPayableAmount(HEDERA_LZ_FEE)
                    .freezeWithSigner(wallet.signer);

                const execTransaction = await wallet.executeTransaction(bridgeTransaction);
                if (execTransaction.error) {
                    showToast('Transaction', execTransaction.error, toastTypes.error);
                    throw execTransaction.error;
                }
            } catch (e) {
                hideLoader();
                throw e;
            }
        } else {
            const approveTransaction = await evmWallet.executeERC20Transaction(
                tokenOne.address,
                'approve',
                false,
                [BRIDGE_ADDRESSES[tokenOne.chain], ethers.utils.parseUnits(tokenOneAmountInput, tokenOne.decimals)],
            );
            if (approveTransaction.error) {
                showToast('Allowance approval transaction error', JSON.stringify(approveTransaction.error), toastTypes.error);
                hideLoader();
                throw approveTransaction.error;
            }

            const bridgeTransaction = await evmWallet.executeERC20Transaction(
                BRIDGE_ADDRESSES[tokenOne.chain],
                'bridgeTokens',
                true,
                [
                    tokenOne.symbol,
                    ethers.utils.parseUnits(tokenOneAmountInput, tokenOne.decimals),
                    ContractId.fromString(wallet.address).toSolidityAddress(),
                    CHAIN_LZ_ID_MAP.get(tokenTwo.chain),
                    options,
                    { value: ETH_LZ_FEE, gasLimit: GAS }
                ],
            );
            if (bridgeTransaction.error) {
                showToast('Bridge transaction error', JSON.stringify(bridgeTransaction.error), toastTypes.error);
                hideLoader();
                throw bridgeTransaction.error;
            }
        }

        hideLoader();
        showToast('Transaction processing', 'Your transaction is being processing. Track the progress on latest transactions page.', toastTypes.success);
    }

    const getActionButton = () => {
        if (!wallet.address) {
            return <button
                className="button swap__button"
                onClick={() => setWalletModalOpen(true)}
            >Connect wallet</button>
        }

        if (!evmWallet.address) {
            return <button
                className="button swap__button"
                onClick={() => setEvmWalletModalOpen(true)}
            >Connect EVM wallet</button>
        }

        let allTokensAssociated = true;
        if (wallet.associatedTokens && tokenOne && tokenTwo) {
            if ((tokenOne.chain === TOKEN_CONFIG_CHAIN.HEDERA && !wallet.associatedTokens.has(TokenId.fromSolidityAddress(tokenOne.address).toString())) ||
                (tokenTwo.chain === TOKEN_CONFIG_CHAIN.HEDERA && !wallet.associatedTokens.has(TokenId.fromSolidityAddress(tokenTwo.address).toString()))) {
                allTokensAssociated = false;
            }
        }
        if (!allTokensAssociated) {
            return <AssociateNewToken handleClick={associateToken} associatedButtons={associatedButtons}/>
        }

        if (!isItEnoughLiquidity()) {
            return <>
                <div className='swap__error'>
                    <span className='swap__error-icon'>&#9888;</span>
                    <div className='swap__error-text'>We don't have enough liquidity to process your transfer. Please
                        use lower amount of {tokenOne.symbol}.
                    </div>
                </div>
                <button
                    className="button swap__button"
                    onClick={sendTokens}
                    disabled={true}
                >Swap
                </button>
            </>
        }

        return <button
            className="button swap__button"
            onClick={sendTokens}
        >Swap</button>
    }

    const calculateContractLiquidity = async (tokenConfig: TokenConfig, isTokenOne: boolean) => {
        let liquidity = BigNumber.from('0');
        if (tokenConfig.chain) {
            if (tokenConfig.chain === TOKEN_CONFIG_CHAIN.HEDERA) {
                const contractId = ContractId.fromSolidityAddress(BRIDGE_ADDRESSES[tokenConfig.chain]).toString();
                const tokenId = ContractId.fromSolidityAddress(tokenConfig.address).toString();
                const balanceRes = await axios.get(`${MIRRORNODE}/api/v1/accounts/${contractId}`);
                const tokenBalance = balanceRes.data.balance.tokens.find((token: any) => token.token_id === tokenId)
                liquidity = BigNumber.from(tokenBalance.balance);
            } else {
                const tokenBalance = await evmWallet.getTokenBalance(BRIDGE_ADDRESSES[tokenConfig.chain], tokenConfig.address);
                liquidity = BigNumber.from(tokenBalance);
            }
        }
        if (isTokenOne) {
            setTokenOneLiquidity(liquidity);
        } else {
            setTokenTwoLiquidity(liquidity);
        }
    }

    const isItEnoughLiquidity = () => {
        if (parseFloat(tokenOneAmountInput)) {
            const tokenOneAmount = ethers.utils.parseUnits(tokenOneAmountInput, tokenOne.decimals);
            return tokenOneAmount.lte(tokenTwoLiquidity);
        }
        return true;
    }

    const associateToken = async (token: TokenConfig) => {
        showLoader();
        const result = await wallet.associateNewToken(token.address);

        if (result) {
            if (result.error) {
                if (result.error === "USER_REJECT") {
                    showToast('Associate Token', `Token ${token.symbol} association was rejected.`, toastTypes.error);
                } else if (result.error.includes('precheck with status')) {
                    showToast('Associate token', result.error, toastTypes.error);
                } else if (result.error.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
                    // "receipt for transaction 0.0.5948290@1703145822.184660155 contained error status TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT"
                    showToast('Associate Token', result.error, toastTypes.error);
                } else {
                    showToast('Error', `An unknown error occurred`, toastTypes.error);
                }
            } else if (result?.res?.nodeId) {
                showToast('Associate Token', `Token ${token.symbol} associated to account`, toastTypes.success);
            }
        } else {
            showToast('Error', `An unknown error occurred.`, toastTypes.error);
        }
        wallet.updateBalance(true);
        checkAssociateTokens();
        hideLoader();
    }

    const checkAssociateTokens = () => {
        if (wallet && wallet.signer === null) {
            setAssociatedButtons([]);
            return;
        }
        if (wallet.associatedTokens && tokenOne?.address && tokenTwo?.address) {
            let tokensToAssociate: TokenConfig[] = [];
            if (!(wallet.associatedTokens?.has(tokenOne.address))) {
                tokensToAssociate.push({...tokenOne});
            }
            if (!(wallet.associatedTokens?.has(tokenTwo.address))) {
                tokensToAssociate.push({...tokenTwo});
            }
            setAssociatedButtons(filterUniqueTokens(tokensToAssociate));
        }
    }

    const filterUniqueTokens = (tokens: TokenConfig[]) => {
        const result = tokens.reduce((acc: TokenConfig[], current: TokenConfig) => {
            const x = acc.find(item => item.address === current.address);
            if (!x) {
                return acc.concat([current]);
            } else {
                return acc;
            }
        }, []);
        return result;
    }

    const getTokenOneAmount = (): string => {
        if (tokenOne) {
            if (tokenOne.chain === TOKEN_CONFIG_CHAIN.HEDERA) {
                return wallet.associatedTokens?.get(TokenId.fromSolidityAddress(tokenOne.address).toString())?.div(Math.pow(10, tokenOne.decimals)).toString();
            } else {
                return evmWallet.associatedTokens?.get(tokenOne.address)?.div(Math.pow(10, tokenOne.decimals)).toString();
            }
        }
        return '';
    }

    const getTokenTwoAmount = (): string => {
        if (tokenTwo) {
            if (tokenTwo.chain === TOKEN_CONFIG_CHAIN.HEDERA) {
                return wallet.associatedTokens?.get(TokenId.fromSolidityAddress(tokenTwo.address).toString())?.div(Math.pow(10, tokenTwo.decimals)).toString();
            } else {
                return evmWallet.associatedTokens?.get(tokenTwo.address)?.div(Math.pow(10, tokenTwo.decimals)).toString();
            }
        }
        return '';
    }

    const triggerCalculation = () => {
        setTokenTwoAmountInput(parseFloat((parseFloat(tokenOneAmountInput) * 0.997).toFixed(6)).toString());
    }

    const setInputByDivider = (divider: number) => {
        const tokenOneAmount = getTokenOneAmount();
        if (tokenOneAmount) {
            changeAmountOne(BigNumber.from(tokenOneAmount).div(divider).toString());
        }
    }

    useEffect(() => {
        if (tokenOneAmountInput === '0') {
            setTokenTwoAmountInput('0');
        } else if (tokenOne.address && tokenTwo.address) {
            triggerCalculation();
        }
    }, [tokenOneAmountInput]);

    useEffect(() => {
        setTokenOne(tokens[DEFAULT_TOKENS[0]]);
        setTokenTwo(tokens[DEFAULT_TOKENS[1]]);
        setTokenOneAmountInput('0');
        setTokenTwoAmountInput('0');
    }, []);

    useEffect(() => {
        triggerCalculation();
    }, [tokenOne, tokenTwo]);

    useEffect(() => {
        checkAssociateTokens();
    }, [wallet]);

    useEffect(() => {
        if (!wallet.address || !evmWallet.address) {
            return;
        }
        if (tokenOne.chain) {
            calculateContractLiquidity(tokenOne, true);
        }
        if (tokenTwo.chain) {
            calculateContractLiquidity(tokenTwo, false);
        }
    }, [tokenOne, tokenTwo, wallet, evmWallet]);


    return (
        <>
            {contextHolder}
            <TokensModal
                hiddenTokens={hiddenTokens}
                modifyToken={modifyToken}
                associatedTokens={wallet.associatedTokens}
                tokens={tokens}
                isOpen={isTokensModalOpen}
                setIsOpen={setIsTokensModalOpen}
                searchPhrase={searchPhrase}
                setSearchPhrase={setSearchPhrase}
                setHiddenTokens={setHiddenTokens}
            />
            <div className="swap">
                <div className="swap__header">
                    <div className="swap__title">Bridge</div>
                </div>
                <div className="swap__field-wrapper">
                    <div className="swap__field">
                        <input
                            placeholder='0'
                            value={tokenOneAmountInput === '0' ? '' : tokenOneAmountInput}
                            onChange={e => changeAmountOne(e.target.value)}
                            disabled={loading()}
                            className='swap__input'
                            type='text'
                        />
                        <span className="swap__field-title">You pay</span>
                        <div className="swap__chip-wrapper">
                            <button className="button swap__chip" onClick={() => setInputByDivider(4)}>25%</button>
                            <button className="button swap__chip" onClick={() => setInputByDivider(2)}>50%</button>
                            <button className="button swap__chip" onClick={() => setInputByDivider(1)}>MAX</button>
                        </div>
                        <div className="swap__coin" onClick={() => openTokensModal(1)}>
                            <img
                                src={tokenOne?.icon}
                                alt="Token one logo"
                                className="swap__coin-icon"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).onerror = null;
                                    (e.target as HTMLImageElement).src = defaultImage;
                                }}
                            />
                            <img
                                src={CHAIN_LOGO_MAP.get(tokenOne.chain)}
                                alt="Chain one logo"
                                className="swap__coin-icon-chain"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).onerror = null;
                                    (e.target as HTMLImageElement).src = defaultImage;
                                }}
                            />
                            <span className="swap__coin-name text--gradient">{tokenOne?.symbol}</span>
                        </div>
                        {getTokenOneAmount() ?
                            <span className="swap__balance">Balance: {getTokenOneAmount()}</span> : ''}
                        <span className="swap__balance-usd">Bridge liquidity: {tokenOneLiquidity.div(Math.pow(10, tokenOne.decimals)).toString()} {tokenOne.symbol}</span>
                    </div>
                    <button className="swap__switch" onClick={switchTokens}>&#10607;</button>
                    <div className="swap__field">
                        <input
                            placeholder='0'
                            value={tokenTwoAmountInput === '0' ? '' : tokenTwoAmountInput}
                            disabled={true}
                            className='swap__input'
                            type='text'
                        />
                        <span className="swap__field-title">You receive</span>
                        <div className="swap__coin" onClick={() => openTokensModal(2)}>
                            <img
                                src={tokenTwo?.icon}
                                alt="Token two logo"
                                className="swap__coin-icon"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).onerror = null;
                                    (e.target as HTMLImageElement).src = defaultImage;
                                }}
                            />
                            <img
                                src={CHAIN_LOGO_MAP.get(tokenTwo.chain)}
                                alt="Chain two logo"
                                className="swap__coin-icon-chain"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).onerror = null;
                                    (e.target as HTMLImageElement).src = defaultImage;
                                }}
                            />
                            <span className="swap__coin-name text--gradient">{tokenTwo?.symbol}</span>
                        </div>
                        {getTokenTwoAmount() ?
                            <span className="swap__balance">Balance: {getTokenTwoAmount()}</span> : ''}
                        <span className="swap__balance-usd">Bridge liquidity: {tokenTwoLiquidity.div(Math.pow(10, tokenTwo.decimals)).toString()} {tokenTwo.symbol}</span>
                    </div>
                </div>
                <div className="swap__details">
                    <div className="swap__network-fee">
                        Bridge fee: ≈{parseFloat((parseFloat(tokenOneAmountInput) * 0.003).toFixed(6)).toString()} {tokenOne.symbol}&nbsp;
                        <Popover
                            trigger='hover'
                            placement='right'
                            content="Bridge fee is 0.3%"
                        >
                            <span className="swap__tooltip">
                                <svg className="swap__question" viewBox="0 0 20 20">
                                    <use href="#icon--question" xlinkHref="#icon--question"></use>
                                </svg>
                            </span>
                        </Popover>
                    </div>
                </div>
                <hr className="swap__divider"/>
                {getActionButton()}
            </div>
        </>
    )
}

export default Swap
