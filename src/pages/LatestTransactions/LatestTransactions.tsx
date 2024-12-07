import React, {useEffect} from 'react';
import BRIDGE_ABI from '../../assets/abi/bridge-abi.json';
import './LatestTransactions.css'
import {BRIDGE_ADDRESSES, BRIDGE_HEDERA_ADDRESS, CHAIN_LOGO_MAP, MIRRORNODE, TOKENS_LIST} from "../../config";
import {TOKEN_CONFIG_CHAIN} from "../../models/TokenConfig";
import {BigNumber, ethers} from "ethers";
import axios from "axios";
import {TokensBridgedEvent} from "./Types/TokensBridgedEvent";
import {TokensReleasedEvent} from "./Types/TokensReleasedEvent";
import {EventPair} from "./Types/EventPair";
// @ts-ignore
import defaultImage from "../../assets/img/default.svg";

function LatestTransactions() {
    const [ethToHederaLogs, setEthToHederaLogs] = React.useState<EventPair[]>([]);
    const [hederaToEthLogs, setHederaToEthLogs] = React.useState<EventPair[]>([]);

    const ethProvider = new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/eth/c5e1a734b4fde91418734740e60f645c2585a1f0ce13d76b87bd938d975e46ca');
    const tokenEthConfig = TOKENS_LIST.find(tokenConfig => tokenConfig.chain === TOKEN_CONFIG_CHAIN.ETH)!;
    const bridgeContract = new ethers.Contract(BRIDGE_ADDRESSES[tokenEthConfig.chain], BRIDGE_ABI, ethers.getDefaultProvider());
    const incomeTransferTopic = ethers.utils.id("TokensBridged(address,address,uint256,address,uint256,uint16)");
    const outcomeTransferTopic = ethers.utils.id("TokensReleased(address,address,uint256)");

    console.log(incomeTransferTopic, outcomeTransferTopic);
    const fetchLogs = async () => {
        const ethLogs = await ethProvider.getLogs({
            address: ethers.utils.getAddress(BRIDGE_ADDRESSES[tokenEthConfig.chain]),
            topics: [[incomeTransferTopic, outcomeTransferTopic]],
            fromBlock: 21203180,
            toBlock: 'latest',
        });

        const hederaLogs = (await axios.get(`${MIRRORNODE}/api/v1/contracts/${BRIDGE_HEDERA_ADDRESS}/results/logs`)).data.logs;


        const incomeEthLogs: TokensBridgedEvent[] = [];
        const outcomeEthLogs: TokensReleasedEvent[] = [];
        const incomeHederaLogs: TokensBridgedEvent[] = [];
        const outcomeHederaLogs: TokensReleasedEvent[] = [];

        console.log(ethLogs);
        ethLogs.sort((a, b) => a.blockNumber - b.blockNumber);
        hederaLogs.sort((a: any, b: any) => a.block_number - b.block_number);
        ethLogs.forEach(log => {
            console.log(log.blockNumber);
            const event = bridgeContract.interface.parseLog(log);
            if (event.name === 'TokensBridged') {
                incomeEthLogs.push(event.args as unknown as TokensBridgedEvent);
            } else if (event.name === 'TokensReleased') {
                outcomeEthLogs.push(event.args as unknown as TokensReleasedEvent);
            }
        });

        hederaLogs.forEach((log: any) => {
            console.log(log.block_number);
            const event = bridgeContract.interface.parseLog(log);
            if (event.name === 'TokensBridged') {
                incomeHederaLogs.push(event.args as unknown as TokensBridgedEvent);
            } else if (event.name === 'TokensReleased') {
                outcomeHederaLogs.push(event.args as unknown as TokensReleasedEvent);
            }
        });

        const logPairsHederaToEth: {income: TokensBridgedEvent, outcome: TokensReleasedEvent}[] = [];
        const logPairsToEthToHedera: {income: TokensBridgedEvent, outcome: TokensReleasedEvent}[] = [];

        incomeHederaLogs.forEach(log => {

        });


        setEthToHederaLogs(matchIncomeAndOutcome(incomeEthLogs, outcomeHederaLogs));
        setHederaToEthLogs(matchIncomeAndOutcome(incomeHederaLogs, outcomeEthLogs));
    }

    //TODO: include LZ tx identifier into event to avoid this
    const matchIncomeAndOutcome = (income: TokensBridgedEvent[], outcome: TokensReleasedEvent[]): EventPair[] => {
        let usedOutcomeIndexes: number[] = [];
        const res: EventPair[] = [];
        for (let incomeIndex = 0; incomeIndex < income.length; incomeIndex++) {
            const outcomeMatchIndex = outcome.map((e, i) => usedOutcomeIndexes.includes(i) ? undefined : e).findIndex(event => {
                return income[incomeIndex].amount.eq(event?.amount || 0) && income[incomeIndex].receiver === event?.receiver;
            });
            let resOutcome;
            if (outcomeMatchIndex !== -1 && !usedOutcomeIndexes.includes(outcomeMatchIndex)) {
                usedOutcomeIndexes.push(outcomeMatchIndex);
                resOutcome = outcome[outcomeMatchIndex];
            }
            res.push({
                income: income[incomeIndex],
                outcome: resOutcome,
            });
        }
        return res;
    };

    useEffect(() => {
        console.log(ethToHederaLogs);
        console.log(hederaToEthLogs);
    }, [ethToHederaLogs, hederaToEthLogs ]);

    useEffect(() => {
        fetchLogs();
    }, []);

    const renderTokenAmount = (amount: BigNumber, address: string) => {
        const token = TOKENS_LIST.find(token => token.address === address);
        return <div className="transaction__amount">{(amount.toNumber() / Math.pow(10, token?.decimals || 0)).toFixed(4)}<img
            className="transaction__currency-icon"
            src={token?.icon || defaultImage}
        /></div>;
    }

    return (
        <div className='transactions'>
            <div className="container">
                <div className="transactions__wrapper">
                    <h4 className="transactions__title">Ethereum to Hedera transactions</h4>
                    {ethToHederaLogs.map((eventPair) =>
                            <div className="transactions__row">
                                <div className="transactions__column">
                                    Sent:
                                    <img
                                        className="transaction__chain-icon"
                                        src={CHAIN_LOGO_MAP.get(TOKEN_CONFIG_CHAIN.ETH)}
                                        alt='Ethereum'
                                    />
                                    <div className="transaction__address">{eventPair.income.sender.substring(0, 5)}...{eventPair.income.sender.substring(36)}</div>
                                    {renderTokenAmount(eventPair.income.amount, eventPair.income.token)}
                                </div>
                                <div className="transactions__column">
                                    {eventPair.outcome ?
                                        <>
                                            Received:
                                            <img
                                                className="transaction__chain-icon"
                                                src={CHAIN_LOGO_MAP.get(TOKEN_CONFIG_CHAIN.HEDERA)}
                                                alt='Hedera'
                                           />
                                            <div className="transaction__address">{eventPair.income.receiver.substring(0, 5)}...{eventPair.income.receiver.substring(36)}</div>
                                            {renderTokenAmount(eventPair.outcome.amount, eventPair.outcome.token)}
                                        </>
                                        : ''}
                                </div>
                            </div>
                        )}
                </div>
                <div className="transactions__wrapper">
                <h4 className="transactions__title">Hedera to Ethereum transactions</h4>
                        {hederaToEthLogs.map((eventPair) =>
                            <div className="transactions__row">
                                <div className="transactions__column">
                                    Sent:
                                    <img
                                        className="transaction__chain-icon"
                                        src={CHAIN_LOGO_MAP.get(TOKEN_CONFIG_CHAIN.HEDERA)}
                                        alt='Hedera'
                                    />
                                    <div className="transaction__address">{eventPair.income.sender.substring(0, 5)}...{eventPair.income.sender.substring(36)}</div>
                                    {renderTokenAmount(eventPair.income.amount, eventPair.income.token)}

                                </div>
                                <div className="transactions__column">
                                    {eventPair.outcome ?
                                        <>
                                            Received:
                                            <img
                                                className="transaction__chain-icon"
                                                src={CHAIN_LOGO_MAP.get(TOKEN_CONFIG_CHAIN.ETH)}
                                                alt='Ethereum'
                                           />
                                            <div className="transaction__address">{eventPair.income.receiver.substring(0, 5)}...{eventPair.income.receiver.substring(36)}</div>
                                            {renderTokenAmount(eventPair.outcome.amount, eventPair.outcome.token)}
                                        </>
                                        : ''}
                                </div>
                            </div>
                        )}
                </div>
            </div>
        </div>
    )
}

export default LatestTransactions
