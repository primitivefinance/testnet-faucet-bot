import { Client } from 'discord.js';
import { BigNumber, Contract, utils } from 'ethers';
import { DefenderRelaySigner, DefenderRelayProvider } from 'defender-relay-client/lib/ethers';
import dotenv from 'dotenv';

dotenv.config();

const credentials = {
  apiKey: process.env.KEY,
  apiSecret: process.env.SECRET,
};

const provider = new DefenderRelayProvider(credentials);
const signer = new DefenderRelaySigner(credentials, provider, {
  speed: 'fast',
});

const client = new Client({
  intents: ['GUILDS', 'GUILD_MESSAGES'],
});

const abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const tokens: { [key: string]: string } = {
  DAI: '0x741171361Ce67caefC7F5CC42157a51958fB6C4A',
  USDC: '0x5358F3D94fffb9c360699e18eeA8E12ecC723ED9',
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.id}`);
});

client.on('messageCreate', async (msg) => {
  if (msg.content.includes('!faucet')) {
    const [, token, address] = msg.content.split(' ');
    const symbol = token.toUpperCase();

    if (utils.isAddress(address)) {
      const contract = new Contract(tokens[symbol], abi, signer);
      const balance = await contract.balanceOf(address) as BigNumber;

      if (balance.isZero()) {
        msg.reply(`Sending ${symbol} testnet tokens to ${address.substring(0, 5)}...${address.substring(address.length - 5, address.length - 1)} :ok_hand:`);

        const tx = await contract.mint(address, utils.parseEther('100'));
        const receipt = await tx.wait();

        console.log('done!', receipt);
      } else {
        msg.reply('You already have test tokens :wink:');
      }
    } else {
      msg.reply('Sorry I can\'t read your address... :frowning:');
    }
  }
});

client.login(process.env.TOKEN);
