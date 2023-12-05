import { json } from "@sveltejs/kit";
import { Web3 } from "web3";

const CHECKERABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address[]",
        name: "contractAddrs",
        type: "address[]",
      },
    ],
    name: "main",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "balance",
            type: "uint256",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "balance",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "allowance",
                type: "uint256",
              },
              {
                internalType: "address",
                name: "contractAddr",
                type: "address",
              },
            ],
            internalType: "struct Finder.Info[]",
            name: "tokensInfo",
            type: "tuple[]",
          },
        ],
        internalType: "struct Finder.AddressData",
        name: "data",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const checkerAddress: {
  [key: string]: {
    checker: string;
    providers: string[];
  };
} = {
  137: {
    checker: "0x9ccb1B989bA099FE17988BD6071338D9BD1aE624",
    providers: [
      "https://polygon.llamarpc.com",
      "https://polygon-rpc.com",
      "https://polygon.rpc.blxrbdn.com",
      "https://polygon-bor.publicnode.com",
      "https://rpc-mainnet.maticvigil.com",
      "https://polygon-mainnet.public.blastapi.io",
      "https://api.zan.top/node/v1/polygon/mainnet/public",
      "wss://polygon-bor.publicnode.com",
      "https://polygon-pokt.nodies.app",
      "https://rpc.ankr.com/polygon",
    ],
  },
  56: {
    checker: "0x92ed27E5668A4C6741d417203b286Ebd73a91Dc4",
    providers: [
      "https://bsc-dataseed.binance.org/",
    ],
  },
};

// const providers = Object.keys(checkerAddress).map((k)=>{
//     return checkerAddress[k].providers.map((p)=>{return new Web3(p)})
// })

export const POST = async ({ request }) => {
  const sentData: {
    chainID: number;
    spender: string;
    owner: string;
    contracts: string[];
  } = await request.json();

  const chainData = checkerAddress[sentData.chainID];
  const web3 = new Web3(chainData.providers[0]);

  const checkerContract = new web3.eth.Contract(CHECKERABI, chainData.checker);

  const res = await checkerContract.methods
    .main(sentData.spender, sentData.owner, sentData.contracts)
    .call();
  const data = res.tokensInfo.map((t) => {
    t.allowance = Number(Web3.utils.fromWei(t.allowance, "ether"));
    t.balance = Number(Web3.utils.fromWei(t.balance, "ether"));
    return {
      allowance: t.allowance,
      balance: t.balance,
      contractAddr: t.contractAddr,
    };
  });
  return json({
    balance: Number(Web3.utils.fromWei(res.balance, "ether")),
    tokens: data,
  });
};
