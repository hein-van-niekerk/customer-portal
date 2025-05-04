import React, { useState } from "react";
import LoginForm from "./components/LoginForm";
import { loginUser } from "./services/api";
import "./styles/Welcome.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = async (email, password) => {
    try {
      // In a real app, you would get a token or user data back
      const response = await loginUser(email, password);
      setIsAuthenticated(true);
      setUser({ email });
      alert("Login successful!");
    } catch (error) {
      alert("Login failed. Please try again.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <div className="app-container">
      <h1>Secure Customer Portal</h1>
      
      {isAuthenticated ? (
        <div className="welcome-message">
          <p>Welcome, {user.email}!</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;

