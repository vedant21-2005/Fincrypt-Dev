// Node modules
import React, { Component } from "react";
import { Link } from "react-router-dom";

// Components
import Navbar from "../Navbar/Navigation";
import NavbarAdmin from "../Navbar/NavigationAdmin";
import NotInit from "../NotInit";

// Contract
import getWeb3 from "../../getWeb3";
import Election from "../../contracts/Election.json";

// CSS
import "./Results.css";

export default class Result extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ElectionInstance: undefined,
      account: null,
      web3: null,
      isAdmin: false,
      candidateCount: undefined,
      candidates: [],
      isElStarted: false,
      isElEnded: false,
    };
  }

  componentDidMount = async () => {
    if (!window.location.hash) {
      window.location = window.location + "#loaded";
      window.location.reload();
    }

    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];
      const instance = new web3.eth.Contract(
        Election.abi,
        deployedNetwork && deployedNetwork.address
      );

      this.setState({ web3, ElectionInstance: instance, account: accounts[0] });

      const candidateCount = await instance.methods.getTotalCandidate().call();
      this.setState({ candidateCount });

      const start = await instance.methods.getStart().call();
      const end = await instance.methods.getEnd().call();
      this.setState({ isElStarted: start, isElEnded: end });

      for (let i = 0; i < candidateCount; i++) {
        const candidate = await instance.methods.candidateDetails(i).call();
        this.state.candidates.push({
          id: candidate.candidateId,
          header: candidate.header,
          slogan: candidate.slogan,
          voteCount: candidate.voteCount,
        });
      }

      this.setState({ candidates: this.state.candidates });

      const admin = await instance.methods.getAdmin().call();
      if (accounts[0] === admin) this.setState({ isAdmin: true });
    } catch (error) {
      alert("Failed to load Web3, accounts, or contract.");
      console.error(error);
    }
  };

  render() {
    const { isAdmin, web3, isElStarted, isElEnded, candidates } = this.state;

    if (!web3) {
      return (
        <>
          {isAdmin ? <NavbarAdmin /> : <Navbar />}
          <div className="loading-card">
            <h3>Loading Web3, accounts, and contract...</h3>
          </div>
        </>
      );
    }

    return (
      <>
        {isAdmin ? <NavbarAdmin /> : <Navbar />}

        <div className="home-wrapper">
          {!isElStarted && !isElEnded ? (
            <NotInit />
          ) : isElStarted && !isElEnded ? (
            <div className="card attention-card">
              <h3>Election in Progress</h3>
              <p>The election is currently running. Results will be visible once it ends.</p>
              <p>
                Go cast your vote if you haven’t already —{" "}
                <Link to="/Voting" className="results-link">
                  Go to Voting
                </Link>
              </p>
            </div>
          ) : (
            !isElStarted &&
            isElEnded && (
              <div className="card results-card">
                {displayResults(candidates)}

              </div>
            )
          )}
        </div>
      </>
    );
  }
}

// Winner Card
function displayWinner(candidates) {
  const getWinner = (candidates) => {
    let maxVote = 0;
    let winners = [];
    for (let c of candidates) {
      if (parseInt(c.voteCount) > maxVote) {
        maxVote = parseInt(c.voteCount);
        winners = [c];
      } else if (parseInt(c.voteCount) === maxVote) {
        winners.push(c);
      }
    }
    return winners;
  };

  const renderWinner = (winner) => (
    <div className="winner-card" key={winner.id}>
      <div className="winner-info">
        <h2>{winner.header}</h2>
        <p className="winner-slogan">{winner.slogan}</p>
      </div>
      <div className="winner-votes">
        <h4>Total Votes</h4>
        <div className="vote-count">{winner.voteCount}</div>
      </div>
    </div>
  );

  const winners = getWinner(candidates);
  return <>{winners.map(renderWinner)}</>;
}

// Result Table
export function displayResults(candidates) {
  return (
    <>
      {candidates.length > 0 && (
        <div className="winner-section">{displayWinner(candidates)}</div>
      )}

      <div className="results-table-section">
        <h3>Election Results</h3>
        <small>Total Candidates: {candidates.length}</small>

        {candidates.length < 1 ? (
          <div className="card attention-card">
            <p>No candidates found.</p>
          </div>
        ) : (
          <table className="results-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Candidate</th>
                <th>Votes</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.header}</td>
                  <td>{c.voteCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
