import deployment from "../../../hardhat/deployments/zircuitGarfield/HotPotato.json";
import { ethers } from "ethers";

const rpcUrl = process.env.RPC_URL!;
const privateKey = process.env.PRIVATE_KEY!;

const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

const contractAddress = deployment.address;
const abi = deployment.abi;

const contract = new ethers.Contract(contractAddress, abi, wallet);

export { contract, wallet };
