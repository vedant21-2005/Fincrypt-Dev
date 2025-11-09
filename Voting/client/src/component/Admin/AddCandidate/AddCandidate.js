// Node modules
import React, { Component } from "react";

// Components
import Navbar from "../../Navbar/Navigation";
import NavbarAdmin from "../../Navbar/NavigationAdmin";
import AdminOnly from "../../AdminOnly";

// Blockchain
import getWeb3 from "../../../getWeb3";
import Election from "../../../contracts/Election.json";

// CSS
import "./AddCandidate.css";

export default class AddCandidate extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ElectionInstance: undefined,
      web3: null,
      account: null,
      isAdmin: false,
      header: "",
      slogan: "",
      candidates: [],
      candidateCount: undefined,
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

      this.setState({
        web3,
        ElectionInstance: instance,
        account: accounts[0],
      });

      const admin = await instance.methods.getAdmin().call();
      if (accounts[0] === admin) this.setState({ isAdmin: true });

      const candidateCount = await instance.methods.getTotalCandidate().call();
      this.setState({ candidateCount });

      for (let i = 0; i < candidateCount; i++) {
        const candidate = await instance.methods.candidateDetails(i).call();
        this.state.candidates.push({
          id: candidate.candidateId,
          header: candidate.header,
          slogan: candidate.slogan,
        });
      }
      this.setState({ candidates: this.state.candidates });
    } catch (error) {
      console.error(error);
      alert(`Failed to load web3, accounts, or contract.`);
    }
  };

  updateHeader = (e) => this.setState({ header: e.target.value });
  updateSlogan = (e) => this.setState({ slogan: e.target.value });

  addCandidate = async (e) => {
    e.preventDefault();
    await this.state.ElectionInstance.methods
      .addCandidate(this.state.header, this.state.slogan)
      .send({ from: this.state.account, gas: 1000000 });
    window.location.reload();
  };

  render() {
    if (!this.state.web3)
      return (
        <>
          {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}
          <center>Loading Web3, accounts, and contract...</center>
        </>
      );

    if (!this.state.isAdmin)
      return (
        <>
          <Navbar />
          <AdminOnly page="Add Candidate Page" />
        </>
      );

    return (
      <>
        <NavbarAdmin />
        <div className="add-candidate-wrapper">
          <div className="card candidate-card">
            <h2>Add a New Candidate</h2>
            <p className="small-text">
              Total Candidates: {this.state.candidateCount}
            </p>

            <form onSubmit={this.addCandidate}>
              <div className="form-group">
                <label className="label-home">Candidate Name</label>
                <input
                  className="input-home"
                  type="text"
                  placeholder="e.g. Marcus"
                  value={this.state.header}
                  onChange={this.updateHeader}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label-home">Slogan</label>
                <input
                  className="input-home"
                  type="text"
                  placeholder="e.g. It is what it is"
                  value={this.state.slogan}
                  onChange={this.updateSlogan}
                  required
                />
              </div>

              <button
                className="btn-primary"
                disabled={
                  this.state.header.length < 3 || this.state.header.length > 21
                }
                type="submit"
              >
                Add Candidate
              </button>
            </form>
          </div>

          <div className="card candidate-list">
            <h3>Candidate List</h3>
            {this.state.candidates.length < 1 ? (
              <div className="no-candidates">No candidates added yet.</div>
            ) : (
              <ul>
                {this.state.candidates.map((candidate, idx) => (
                  <li key={idx}>
                    <span className="candidate-id">{candidate.id}.</span>{" "}
                    <strong>{candidate.header}</strong> — {candidate.slogan}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </>
    );
  }
}
