import React, { useEffect, useState } from "react";
import "./styles/App.css";
import { ethers } from "ethers";
import abi from "./utils/WackoWordsNFT.json";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFreeCodeCamp,
  faGithub,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

const App = () => {
  // smart contract details

  const CONTRACT_ADDRESS = "0x1B87dAeb6c25c0582D96ef29f7eE07C50Ff88Fa4";
  const contractABI = abi.abi;

  // state variables

  const [currentAccount, setCurrentAccount] = useState("");
  const [mintCount, setMintCount] = useState("?");
  const [mining, setMiningStatus] = useState("");
  const [error, setErrMsg] = useState("");
  const [tokenIds, addTokenId] = useState([]);
  const [status, changeStatus] = useState("danger");
  const [checked, setChecked] = useState(false);
  const [contract, setContract] = useState(null);
  const [btn, setBtn] = useState({ disabled: false, opacity: 1 });
  const [mintInfo, setMintInfo] = useState("");

  // function to make sure users have acknowledged testnet notice

  const notice = () => {
    if (status === "success") {
      changeStatus("danger");
    } else {
      changeStatus("success");
    }
    setChecked((old) => !old);
  };

  // function to save solidity minting contract in state if present

  const checkContract = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const mintContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI,
          signer
        );
        setContract(mintContract);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // function to add delay for error messages disappearing

  const delayedMsg = (msg, time) => {
    setErrMsg(msg);
    setTimeout(() => {
      setErrMsg("");
    }, time);
  };

  // function for checking whether user is connected to correct blockchain

  const checkChain = async (chainName) => {
    const chains = {
      Rinkeby: "0x4",
      Ropsten: "0x3",
      Goerli: "0x5",
    };

    let chainId = await ethereum.request({ method: "eth_chainId" });
    console.log("Connected to chain " + chainId);

    const appChainId = chains[chainName];
    console.log(appChainId);

    if (chainId !== appChainId) {
      delayedMsg(
        `Please make sure your wallet is connected to the ${chainName} Test Network`,
        2000
      );
      return false;
    }
    return true;
  };

  // get current mint count function

  const getMintCount = async () => {
    try {
      const mints = await contract.getTotalNFTCount();
      console.log(mints);
      setMintCount(mints);
      return mints;
    } catch (error) {
      console.log(error);
    }
  };

  // check if wallet is connected function

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) return alert("Please install Metamask.");
    console.log(`We have the ethereum object: ${ethereum}`);

    const chain = await checkChain("Goerli");
    if (!chain) return;

    const accounts = await ethereum.request({ method: "eth_accounts" });

    // user may have multiple active accounts; the first one is taken

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log(`Found authourised account: ${account}`);
      setCurrentAccount(account);
      checkContract();
    } else {
      console.log("No authorised account found. Please Connect your wallet.");
    }
  };

  // connect wallet function

  const connectWallet = async () => {
    try {
      if (!checked)
        return delayedMsg("Please first acknowledge the notice below", 3000);

      const { ethereum } = window;

      if (!ethereum) return alert("Please install Metamask");

      const chain = await checkChain("Goerli");
      if (!chain) return;

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log(`${accounts[0]} is connected`);
      setCurrentAccount(accounts[0]);
      checkContract();
    } catch (error) {
      console.log(error);
      return delayedMsg("Sorry, an error has occured. Please try again.", 3000);
    }
  };

  // NFT minting function

  const mintNFT = async () => {
    setBtn({ disabled: true, opacity: 0.5 });
    setMintInfo("");

    try {
      const { ethereum } = window;
      if (!ethereum) return alert("Please install Metamask.");
      console.log(`We have the ethereum object: ${ethereum}`);

      const chain = await checkChain("Goerli");
      if (!chain) return;

      let nftTxn = await contract.makeAnEpicNFT();
      setMiningStatus("Minting");
      console.log("Minting...");
      nftTxn.wait();
      console.log(
        `Mined, see transaction: https://goerli.etherscan.io/tx/${nftTxn.hash}`
      );
    } catch (error) {
      console.log(error.code);
      setBtn({ disabled: false, opacity: 1 });
      setMiningStatus("");
      if (error.code === "UNPREDICTABLE_GAS_LIMIT")
        return delayedMsg(
          "Sorry, you've already used up your three mints",
          3000
        );

      return delayedMsg("Sorry, an error has occured. Please try again.", 3000);
    }
  };

  // add mint listener function

  const mintListener = async () => {
    const onNewMint = async (from, tokenId) => {
      getMintCount();
      console.log("from:", from);
      console.log("CA:", currentAccount);

      if (from.toLowerCase() === currentAccount) {
        console.log("NewMint", from, tokenId.toNumber());
        setMiningStatus("Mining Complete");
        setTimeout(() => {
          setMiningStatus("");
        }, 2000);

        setMintInfo(
          <p>
            Hey there! We've minted your NFT and sent it to your wallet. It may
            take a short while to to show up on Opensea. Click{" "}
            <a
              href={`https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`}
              target="_blank"
            >
              here
            </a>{" "}
            to view.
          </p>
        );
        setBtn({ disabled: false, opacity: 1 });
      }
    };

    if (!contract) return;

    console.log("listening for mints....");

    getMintCount();
    contract.on("NewEpicNFTMinted", onNewMint);

    return () => {
      if (contract) {
        contract.off("NewEpicNFTMinted", onNewMint);
      }
    };
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    mintListener();
  }, [contract]);

  // Render Methods
  const renderNotConnectedContainer = () => (
    <div>
      <button
        className="cta-button connect-wallet-button"
        onClick={connectWallet}
      >
        CONNECT
      </button>
      <div id="cont">
        <div id="notice">
          <p id="notice-text">
            Wacko Words NFT lives on Ethereum's Goerli Test Network.{" "}
            <strong>Never</strong> send real Eth to your testnet address. If you
            did, you would lose it.{" "}
            <a
              href="https://medium.com/compound-finance/the-beginners-guide-to-using-an-ethereum-test-network-95bbbc85fc1d"
              target="_blank"
            >
              Testnets
            </a>{" "}
            use test Eth which you can get for free from{" "}
            <a href="https://faucets.chain.link/goerli" target="_blank">
              Chainlink
            </a>{" "}
            or other faucets. It is recommended that you create a separate
            wallet for use on test networks.
          </p>
          <div id="checkbox-block">
            <button
              type="button"
              className={`btn btn-${status}`}
              onClick={notice}
            >
              Acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header header-text">Wacko Words NFT</p>
          <p className="sub-text">
            Absurd three-word combo NFTs; their meanings depend on what you make
            of them ;-).
          </p>
          <div id="info">
            <p>
              Once you connect your wallet, click below to mint up to three
              snazzy{" "}
              <a
                href="https://testnets.opensea.io/collection/wacko-words-nft-v2"
                target="_blank"
              >
                <u>Wacko Words NFTs</u>
              </a>{" "}
              for free; you'll also be able to see how many have been minted so
              far - there are a hundred up for grabs! Word combinations and
              background colors will be randomly gererated upon mint.{" "}
            </p>
            <p>
              Once minted to your wallet, you will receive a message with a link
              to your NFT on Opensea. It may take a short while for it to appear
              on the site. In the meantime, you can also check out the
              collection of current mints on{" "}
              <a
                href="https://testnets.opensea.io/collection/wacko-words-nft-v2"
                target="_blank"
              >
                <u>Opensea</u>
              </a>
              .
            </p>
          </div>
          {mintInfo && <div id="mint-notice">{mintInfo}</div>}
          {mining && (
            <div id="minting-block">
              <p className="mining">{mining}</p>
              <p className="loader"></p>
            </div>
          )}
          <div>
            <p className="mintCount">{mintCount.toString()}/100 minted.</p>
          </div>
          {error && (
            <div>
              <p className="error">{error}</p>
            </div>
          )}
          {currentAccount === "" ? (
            <div id="not-connected">{renderNotConnectedContainer()}</div>
          ) : (
            <button
              onClick={mintNFT}
              className="cta-button connect-wallet-button"
              disabled={btn.disabled}
              style={{ opacity: btn.opacity }}
            >
              MINT
            </button>
          )}
        </div>
        <div className="row align-items-center" style={{ marginTop: "2rem" }}>
          <div className="col-lg-6">
            <img
              className="nft"
              src="/assets/01.svg"
              alt="an NFT from the collection"
            />
          </div>
          <div className="col-lg-6">
            <img className="nft" src="/assets/02.svg" />
          </div>
          <div className="col-lg-6">
            <img
              className="nft"
              src="/assets/03.svg"
              alt="an NFT from the collection"
            />
          </div>
          <div className="col-lg-6">
            <img
              className="nft"
              src="/assets/04.svg"
              alt="an NFT from the collection"
            />
          </div>
        </div>
        <div id="contact-block">
          <h4 id="designer">
            developed by{" "}
            <a href="https://scottsdev.net" target="_blank">
              Scott Mitchell
            </a>
          </h4>
          <a
            href="https://github.com/scott-a-m"
            target="_blank"
            rel="noreferrer"
          >
            <FontAwesomeIcon
              icon={faGithub}
              size="2x"
              border
              className="contact-icon"
            />
          </a>
          <a
            href="https://twitter.com/scotts_dev"
            target="_blank"
            rel="noreferrer"
          >
            <FontAwesomeIcon
              icon={faTwitter}
              size="2x"
              border
              className="contact-icon"
            />
          </a>
          <a
            href="https://www.freecodecamp.org/scott-a-m"
            target="_blank"
            rel="noreferrer"
          >
            <FontAwesomeIcon
              icon={faFreeCodeCamp}
              size="2x"
              border
              className="contact-icon"
            />
          </a>
          <a href="mailto:scott@scottsdev.net">
            <FontAwesomeIcon
              icon={faEnvelope}
              size="2x"
              border
              className="contact-icon"
            />
          </a>
          <p style={{ marginTop: "2rem" }}>
            with{" "}
            <a href="https://buildspace.so/" target="_blank">
              Buildspace
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
