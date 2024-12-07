import type { MetaMaskInpageProvider } from "@metamask/providers";

declare module "*.png";
declare module "*.svg";
declare module "*.jpeg";
declare module "*.jpg";
declare module "*.webp";

declare global {
    interface Window {
        ethereum?: ExternalProvider;
    }
}