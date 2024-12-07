import Long from 'long';
import {ethers} from "ethers";
import {JsonRpcSigner} from "@ethersproject/providers/lib/json-rpc-provider";
import {SUPPORTED_CHAINS, TOKENS_LIST} from "../../config";
import ERC20_ABI from '../../assets/abi/erc20-abi.json';
import BRIDGE_ABI from '../../assets/abi/bridge-abi.json';
import {TOKEN_CONFIG_CHAIN, TOKEN_CONFIG_SYMBOL} from "../../models/TokenConfig";

export class Metamask {
    name = 'metamask';
    address = '';
    signer: JsonRpcSigner | null = null;
    appMetadata = {
        url: "https://bridge.etaswap.com",
        name: "EtaSwap",
        description: "DEX aggregator",
        iconUrl: "https://etaswap.com/logo-bg.svg",
    };
    setWallet: any;
    associatedTokens: Map<string, Long> | undefined;

    constructor(setWallet: any) {
        this.setWallet = setWallet;
    }

    refreshWallet() {
        this.setWallet({
            name: this.name,
            address: this.address,
            signer: this.signer,
            associatedTokens: this.associatedTokens,
            executeERC20Transaction: this.executeERC20Transaction.bind(this),
            updateBalance: this.updateBalance.bind(this),
            getTokenBalance: this.getTokenBalance.bind(this),
        });
    }

    async connect(onLoad = false) {
        if (!window.ethereum) {
            console.error("Metamask is not installed.");
        }
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []); // Request account access
        const { chainId } = await provider.getNetwork();
        if (!SUPPORTED_CHAINS.includes(chainId)) {
            console.error("Please switch to one of the supported chains.");
            return;
        }
        this.signer = provider.getSigner();
        this.address = await this.signer.getAddress();

        this.refreshWallet();
    }

    async updateBalance() {
        if (this.signer) {
            for (const token of TOKENS_LIST) {
                if (token.chain === TOKEN_CONFIG_CHAIN.ETH) {
                    const contract = new ethers.Contract(token.address, ERC20_ABI, this.signer);
                    const balance = await contract.balanceOf(this.address);
                    if (!this.associatedTokens) {
                        this.associatedTokens = new Map();
                    }
                    this.associatedTokens.set(token.address, Long.fromString(balance.toString()));
                }
            }
        } else {
            this.associatedTokens = undefined;
        }
        this.refreshWallet();
    }

    async getTokenBalance (contractAddress: string, tokenAddress: string) {
        if (!this.signer) {
           return null;
        }
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
        const balance = await contract.balanceOf(contractAddress);
        return balance.toString();
    }

    async executeERC20Transaction(tokenAddress: string, functionName: string, isBridge: boolean, args: any[]) {
        if (!this.signer) {
            return {
                error: "Connect to MetaMask first.",
                res: null,
            }
        }

        try {
            const contract = new ethers.Contract(
                tokenAddress,
                isBridge? BRIDGE_ABI : ERC20_ABI,
                this.signer
            );
            const tx = await contract[functionName](...args);
            await tx.wait();
            return {
                error: null,//res.success ? null : (res.error?.message || res.error.toString()),
                res: tx,
            }
        } catch (error) {
            return {
                error,
                res: null,
            }
        }
    }

    async disconnect() {
        this.signer = null;
        this.address = '';
        this.refreshWallet();
    }

}
