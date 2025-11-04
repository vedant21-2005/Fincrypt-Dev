import React, { Component } from "react";

import Navbar from "../../Navbar/Navigation";
import NavbarAdmin from "../../Navbar/NavigationAdmin";
import AdminOnly from "../../AdminOnly";

import getWeb3 from "../../../getWeb3";
import Election from "../../../contracts/Election.json";

import "./Verification.css";

export default class Verification extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ElectionInstance: undefined,
      account: null,
      web3: null,
      isAdmin: false,
      voterCount: undefined,
      voters: [],
    };
  }

  async componentDidMount() {
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

      const admin = await instance.methods.getAdmin().call();
      if (accounts[0] === admin) this.setState({ isAdmin: true });

      const voterCount = await instance.methods.getTotalVoter().call();
      this.setState({ voterCount });

      for (let i = 0; i < voterCount; i++) {
        const voterAddress = await instance.methods.voters(i).call();
        const voter = await instance.methods.voterDetails(voterAddress).call();

        this.state.voters.push({
          address: voter.voterAddress,
          name: voter.name,
          phone: voter.phone,
          hasVoted: voter.hasVoted,
          isVerified: voter.isVerified,
          isRegistered: voter.isRegistered,
        });
      }
      this.setState({ voters: this.state.voters });
    } catch (error) {
      alert(`Failed to load web3, accounts, or contract.`);
      console.error(error);
    }
  }

  verifyVoter = async (verifiedStatus, address) => {
    await this.state.ElectionInstance.methods
      .verifyVoter(verifiedStatus, address)
      .send({ from: this.state.account, gas: 1000000 });
    window.location.reload();
  };

  renderUnverifiedVoters = (voter) => {
    return (
      <div
        className={`voter-card ${
          voter.isVerified ? "verified" : "unverified"
        }`}
        key={voter.address}
      >
        <div className="voter-info">
          <table>
            <tbody>
              <tr>
                <th>Account Address</th>
                <td>{voter.address}</td>
              </tr>
              <tr>
                <th>Name</th>
                <td>{voter.name}</td>
              </tr>
              <tr>
                <th>Phone</th>
                <td>{voter.phone}</td>
              </tr>
              <tr>
                <th>Voted</th>
                <td>{voter.hasVoted ? "True" : "False"}</td>
              </tr>
              <tr>
                <th>Verified</th>
                <td>
                  <span
                    className={`status-badge ${
                      voter.isVerified ? "green" : "red"
                    }`}
                  >
                    {voter.isVerified ? "Verified" : "Pending"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {!voter.isVerified && (
          <button
            className="btn-approve"
            onClick={() => this.verifyVoter(true, voter.address)}
          >
            Approve
          </button>
        )}
      </div>
    );
  };

  render() {
    const { isAdmin, web3, voters } = this.state;

    if (!web3)
      return (
        <>
          {isAdmin ? <NavbarAdmin /> : <Navbar />}
          <center>Loading Web3, accounts, and contract...</center>
        </>
      );

    if (!isAdmin)
      return (
        <>
          <Navbar />
          <AdminOnly page="Verification Page" />
        </>
      );

    return (
      <>
        <NavbarAdmin />
        <div className="verification-wrapper">
          <div className="card verification-header">
            <h2>Voter Verification</h2>
            <p>Total Registered Voters: {voters.length}</p>
          </div>

          {voters.length < 1 ? (
            <div className="card info-card">
              <p>No voters have registered yet.</p>
            </div>
          ) : (
            <div className="voter-list">{voters.map(this.renderUnverifiedVoters)}</div>
          )}
        </div>
      </>
    );
  }
}
