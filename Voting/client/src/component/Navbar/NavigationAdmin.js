import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

export default function NavbarAdmin() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <NavLink to="/Home" className="logo">
          Home
        </NavLink>
      </div>

      <ul className={`nav-links ${open ? "open" : ""}`}>
        <li>
          <NavLink to="/Verification" activeClassName="active-link">
            Verification
          </NavLink>
        </li>
        <li>
          <NavLink to="/AddCandidate" activeClassName="active-link">
            Add Candidate
          </NavLink>
        </li>
        <li>
          <NavLink to="/Registration" activeClassName="active-link">
            Registration
          </NavLink>
        </li>
        <li>
          <NavLink to="/Voting" activeClassName="active-link">
            Voting
          </NavLink>
        </li>
        <li>
          <NavLink to="/Results" activeClassName="active-link">
            Results
          </NavLink>
        </li>
      </ul>

      <div className="burger" onClick={() => setOpen(!open)}>
        <i className="fas fa-bars"></i>
      </div>
    </nav>
  );
}
