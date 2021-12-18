import { Client } from 'discord.js';
import { Contract, utils, ContractTransaction } from 'ethers';
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
let isBusy = false;

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.id}`);
});

client.on('messageCreate', async (msg) => {
  if (msg.content.includes('!faucet')) {
    if (isBusy) {
      msg.reply('Please wait for your turn :eyes:');
      return;
    }

    const [, address] = msg.content.split(' ');

    if (hasClaimed[address]) {
      msg.reply('Testnet tokens already claimed :wink:');
      return;
    }

    if (utils.isAddress(address)) {
      isBusy = true;
      const contract = new Contract('0x883cde7dadE9631E4a951Ca16fd3CA2fb05c5a62', abi, signer);

      try {
        const tx = await contract.mint(address) as ContractTransaction;
        msg.reply(`Sending testnet tokens https://rinkeby.etherscan.io/tx/${tx.hash} :clap:`);
        await tx.wait();
        hasClaimed[address] = true;
        console.log('done!');
      } catch (e) {
        console.error(e);
      } finally {
        isBusy = false;
      }
    } else {
      msg.reply('Can\'t read your address... :frowning:');
    }
  }
});

client.login(process.env.TOKEN);
