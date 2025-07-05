import { ethers } from "ethers";
import deployment from "../../hardhat/deployments/zircuitGarfield/HotPotato.json" assert { type: "json" };

const rpcUrl = process.env.RPC_URL!;
const privateKey = process.env.PRIVATE_KEY!;

const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

const contractAddress = deployment.address;
const abi = deployment.abi;

const contract = new ethers.Contract(contractAddress, abi, wallet);

export { contract, wallet };
