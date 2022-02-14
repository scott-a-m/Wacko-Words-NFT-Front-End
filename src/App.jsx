import React, { useEffect, useState } from "react";
import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import one from "./assets/one.svg";
import two from "./assets/two.svg";
import three from "./assets/three.svg";
import five from "./assets/five.svg";
import { ethers } from "ethers";
import abi from "./utils/WackoWordsNFT.json";

// Constants
const TWITTER_HANDLE = "scott_xiaohu";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  /*
   * Just a state variable we use to store our user's public wallet. Don't forget to import useState.
   */

  const CONTRACT_ADDRESS = "0x5A4BB9aE5ca5bE73997b523108b52B0D52eaCf4c";
  const contractABI = abi.abi;

  const [currentAccount, setCurrentAccount] = useState("");
  const [mintCount, setMintCount] = useState("?");
  const [mining, setMiningStatus] = useState("");
  const [error, setErrorStatus] = useState("");
  const [tokenIds, addTokenId] = useState([]);
  const [status, changeStatus] = useState("danger");
  const [checked, setChecked] = useState(false);

  const notice = () => {
    if (status === "success") {
      changeStatus("danger");
    } else {
      changeStatus("success");
    }

    setChecked((old) => !old);
  };

  const checkChain = async () => {
    let chainId = await ethereum.request({ method: "eth_chainId" });
    console.log("Connected to chain " + chainId);
    const appChainId = "0x4";
    if (chainId !== appChainId) {
      setErrorStatus(
        "Please make sure your wallet is connected to the Rinkeby Test Network"
      );
      setTimeout(() => {
        setErrorStatus("");
      }, 3000);
      return false;
    } else {
      return true;
    }
  };

  // Check whether wallet's connected

  const getMintCount = async () => {
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

        const mints = await mintContract.getTotalNFTCount();
        console.log(mints);
        setMintCount(mints);
        return mints;
      } else {
        console.log("Ethereum object does not exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Please install Metamask.");
      return;
    } else {
      console.log(`We have the ethereum object: ${ethereum}`);
    }

    const chain = await checkChain();

    if (!chain) {
      return;
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    // user may have multiple active accounts; we use the first one

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log(`Found authourised account: ${account}`);
      setCurrentAccount(account);
      getMintCount();
      mintListener();
    } else {
      console.log("No authorised account found. Please Connect your wallet.");
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!checked) {
        setErrorStatus("Please first acknowledge the notice below");
        setTimeout(() => {
          setErrorStatus("");
        }, 3000);
        return;
      }

      if (!ethereum) {
        alert("Please install Metamask");
        return;
      }

      const chain = await checkChain();

      if (!chain) {
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log(`${accounts[0]} is connected`);
      setCurrentAccount(accounts[0]);
      getMintCount();
      mintListener();
    } catch (error) {
      setErrorStatus("Sorry, an error has occured. Please try again.");
      setTimeout(() => {
        setErrorStatus("");
      }, 3000);
      console.log(error);
    }
  };

  const mintNFT = async () => {
    setErrorStatus("");

    try {
      const { ethereum } = window;
      if (ethereum) {
        const chain = await checkChain();

        if (!chain) {
          return;
        }
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI,
          signer
        );
        let nftTxn = await connectedContract.makeAnEpicNFT();
        console.log("Minting...");
        setMiningStatus("Minting");
        nftTxn.wait();
        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );
      } else {
        console.log("Ethereum object does not exist.");
      }
    } catch (error) {
      if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        setErrorStatus("Sorry, you've already used up your three mints");
      } else {
        setErrorStatus("Sorry, an error has occured. Please try again.");
      }
      console.log(error.code);
    }
  };

  // add mint listener

  const mintListener = async () => {
    const onNewMint = async (from, tokenId) => {
      setMiningStatus("");

      const count = await getMintCount();
      const countStr = count.toString();
      let countInt = parseInt(countStr);
      console.log(countInt);

      console.log("NewMint", from, tokenId.toNumber());
      alert(
        `Hey there! We've minted your NFT and sent it to your wallet. It may take a short while to to show up on opensea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
      );
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const mintContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI,
        signer
      );
      mintContract.on("NewEpicNFTMinted", onNewMint);
    }

    return () => {
      if (mintContract) {
        mintContract.off("NewEpicNFTMinted", onNewMint);
      }
    };
  };

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
            Wacko Words NFT lives on Ethereum's Rinkeby Test Network.{" "}
            <strong>Never</strong> send real Eth to your testnet address. If you
            did, you would lose it.{" "}
            <a
              href="https://medium.com/compound-finance/the-beginners-guide-to-using-an-ethereum-test-network-95bbbc85fc1d"
              target="_blank"
            >
              Testnets
            </a>{" "}
            use test Eth which you can get for free from{" "}
            <a href="https://faucets.chain.link/rinkeby" target="_blank">
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

  // create function to avoid overemitting events

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

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

          <div>
            <p className="mintCount">{mintCount.toString()}/100 minted.</p>
          </div>
          {error && (
            <div>
              <p className="error">{error}</p>
            </div>
          )}
          {mining && (
            <div id="minting-block">
              <p className="mining">{mining}</p>
              <p className="loader"></p>
            </div>
          )}
          {currentAccount === "" ? (
            <div id="not-connected">{renderNotConnectedContainer()}</div>
          ) : (
            <button
              onClick={mintNFT}
              className="cta-button connect-wallet-button"
            >
              MINT
            </button>
          )}
        </div>
        <div className="row align-items-center">
          <div className="col-lg-6">
            <img className="nft" src={two} alt="an NFT from the collection" />
          </div>
          <div className="col-lg-6">
            <img className="nft" src={one} />
          </div>
          <div className="col-lg-6">
            <img className="nft" src={three} alt="an NFT from the collection" />
          </div>
          <div className="col-lg-6">
            <img className="nft" src={five} alt="an NFT from the collection" />
          </div>
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`${TWITTER_HANDLE}`}</a>
        </div>
        <p style={{ paddingBottom: "30px", fontStyle: "italic" }}>
          Built with{" "}
          <a href="https://buildspace.so/" target="_blank">
            Buildspace
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default App;
