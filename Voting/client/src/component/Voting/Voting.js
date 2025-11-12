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
import "./Voting.css";

export default class Voting extends Component {
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
      currentVoter: {
        address: undefined,
        name: null,
        phone: null,
        hasVoted: false,
        isVerified: false,
        isRegistered: false,
      },
      // OTP Modal States
      showOTPModal: false,
      enteredOTP: "",
      otpSessionId: "",
      selectedCandidate: null,
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

      const candidateCount = await instance.methods.getTotalCandidate().call();
      this.setState({ candidateCount });

      const start = await instance.methods.getStart().call();
      const end = await instance.methods.getEnd().call();
      this.setState({ isElStarted: start, isElEnded: end });

      // Load all candidates
      const candidates = [];
      for (let i = 0; i < candidateCount; i++) {
        const candidate = await instance.methods.candidateDetails(i).call();
        candidates.push({
          id: candidate.candidateId,
          header: candidate.header,
          slogan: candidate.slogan,
        });
      }
      this.setState({ candidates });

      // Current voter info
      const voter = await instance.methods.voterDetails(accounts[0]).call();
      this.setState({
        currentVoter: {
          address: voter.voterAddress,
          name: voter.name,
          phone: voter.phone,
          hasVoted: voter.hasVoted,
          isVerified: voter.isVerified,
          isRegistered: voter.isRegistered,
        },
      });

      const admin = await instance.methods.getAdmin().call();
      if (accounts[0] === admin) this.setState({ isAdmin: true });
    } catch (error) {
      alert("Failed to load Web3, accounts, or contract.");
      console.error(error);
    }
  };

  // ✅ Blockchain Voting Function
  castVote = async (id) => {
    await this.state.ElectionInstance.methods
      .vote(id)
      .send({ from: this.state.account, gas: 1000000 });
    window.location.reload();
  };

  // ✅ Verify OTP and Vote
// ✅ Verify OTP and Vote
verifyOTPAndVote = async () => {
  const { enteredOTP, otpSessionId, selectedCandidate } = this.state;
  if (!enteredOTP) {
    alert("Please enter the OTP.");
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:5001/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: otpSessionId,
        otp: enteredOTP,
      }),
    });
    const data = await res.json();

    if (data.verified) {
      alert("✅ OTP verified successfully! Your vote will be recorded.");

      // Cast the vote on blockchain
      await this.state.ElectionInstance.methods
        .vote(selectedCandidate.id)
        .send({ from: this.state.account, gas: 1000000 });

      // ✅ Update voter state instantly (no reload needed)
      this.setState((prev) => ({
        showOTPModal: false,
        enteredOTP: "",
        currentVoter: { ...prev.currentVoter, hasVoted: true },
      }));

      alert("🎉 Vote recorded successfully!");
    } else {
      alert("❌ Invalid or expired OTP. Please try again.");
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    alert("An error occurred during OTP verification.");
  }
};


  // ✅ Confirm Vote + Send OTP
  renderCandidates = (candidate) => {
    const confirmVote = async (id, header) => {
      const phone = this.state.currentVoter.phone;

      if (!phone) {
        alert("No phone number registered for this voter.");
        return;
      }

      const confirm = window.confirm(
        `Vote for ${header} (ID: ${id})?\nA verification OTP will be sent to your registered number (${phone}).`
      );
      if (!confirm) return;

      try {
        const res = await fetch("http://127.0.0.1:5001/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: phone }),
        });
        const data = await res.json();

        if (res.ok) {
          this.setState({
            showOTPModal: true,
            otpSessionId: data.sessionId,
            selectedCandidate: { id, header },
          });
        } else {
          alert(data.message || "Failed to send OTP. Please try again.");
        }
      } catch (error) {
        console.error("Error sending OTP:", error);
        alert("An error occurred while sending OTP.");
      }
    };

    return (
      <div className="card candidate-card" key={candidate.id}>
        <div className="candidate-info">
          <h3>
            {candidate.header} <small>#{candidate.id}</small>
          </h3>
          <p className="slogan">{candidate.slogan}</p>
        </div>
        <div className="vote-btn-container">
          <button
            onClick={() => confirmVote(candidate.id, candidate.header)}
            className="vote-btn"
            disabled={
              !this.state.currentVoter.isRegistered ||
              !this.state.currentVoter.isVerified ||
              this.state.currentVoter.hasVoted
            }
          >
            Vote
          </button>
        </div>
      </div>
    );
  };

  render() {
    if (!this.state.web3) {
      return (
        <>
          {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}
          <div className="loading-card">
            <h3>Loading Web3, accounts, and contract...</h3>
          </div>
        </>
      );
    }

    return (
      <>
        {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}

        <div className="home-wrapper">
          {!this.state.isElStarted && !this.state.isElEnded ? (
            <NotInit />
          ) : this.state.isElStarted && !this.state.isElEnded ? (
            <>
              <div className="card status-card">
                {this.state.currentVoter.isRegistered ? (
                  this.state.currentVoter.isVerified ? (
                    this.state.currentVoter.hasVoted ? (
                      <div className="success-card">
                        <h3>You've already cast your vote.</h3>
                        <Link to="/Results" className="results-link">
                          View Results
                        </Link>
                      </div>
                    ) : (
                      <p>Go ahead and cast your vote.</p>
                    )
                  ) : (
                    <p className="attention-card">
                      Please wait for admin verification.
                    </p>
                  )
                ) : (
                  <div className="attention-card">
                    <p>You’re not registered. Please register first.</p>
                    <Link to="/Registration" className="results-link">
                      Go to Registration Page
                    </Link>
                  </div>
                )}
              </div>

              {/* ✅ Show candidate list only if user hasn’t voted yet */}
              {!this.state.currentVoter.hasVoted && (
                <div className="card candidate-list-card">
                  <h3>Candidates</h3>
                  <small className="total-voters-text">
                    Total Candidates: {this.state.candidates.length}
                  </small>
                  {this.state.candidates.length < 1 ? (
                    <div className="attention-card">
                      <p>No candidates added yet.</p>
                    </div>
                  ) : (
                    this.state.candidates.map(this.renderCandidates)
                  )}
                </div>
              )}

            </>
          ) : (
            this.state.isElEnded && (
              <div className="card attention-card">
                <h3>The Election has ended.</h3>
                <Link to="/Results" className="results-link">
                  See Results
                </Link>
              </div>
            )
          )}
        </div>

        {/* ✅ OTP Modal */}
        {this.state.showOTPModal && (
          <div className="otp-modal-overlay">
            <div className="otp-modal">
              <h3>Verify Your Identity</h3>
              <p>An OTP has been sent to your registered phone number.</p>

              <input
                type="text"
                placeholder="Enter OTP"
                value={this.state.enteredOTP}
                onChange={(e) =>
                  this.setState({ enteredOTP: e.target.value })
                }
                className="otp-input"
                maxLength="6"
              />

              <div className="otp-modal-buttons">
                <button
                  onClick={this.verifyOTPAndVote}
                  className="btn-primary"
                >
                  Verify & Vote
                </button>
                <button
                  onClick={() =>
                    this.setState({ showOTPModal: false, enteredOTP: "" })
                  }
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}
