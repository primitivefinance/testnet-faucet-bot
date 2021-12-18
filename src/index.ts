import { Client } from 'discord.js';
import { Contract, utils } from 'ethers';
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
        name: "to",
        type: "address",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const hasClaimed: { [key: string]: boolean } = {};

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.id}`);
});

client.on('messageCreate', async (msg) => {
  if (msg.content.includes('!faucet')) {
    const [, address] = msg.content.split(' ');

    if (hasClaimed[address]) {
      msg.reply('Testnet tokens already claimed :wink:');
      return;
    }

    if (utils.isAddress(address)) {
      const contract = new Contract('0x883cde7dadE9631E4a951Ca16fd3CA2fb05c5a62', abi, signer);

      msg.reply(`Sending testnet tokens to ${address.substring(0, 5)}...${address.substring(address.length - 5, address.length - 1)} :ok_hand:`);

      const tx = await contract.mint(address);
      const receipt = await tx.wait();

      console.log('done!', receipt);

      hasClaimed[address] = true;
    } else {
      msg.reply('Can\'t read your address... :frowning:');
    }
  }
});

client.login(process.env.TOKEN);
