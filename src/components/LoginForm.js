import React, { useState } from "react";
import { loginUser } from "../services/api";

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

    if (!emailRegex.test(email)) {
        newErrors.email = 'Invalid email format';
      }
      
      if (!passwordRegex.test(password)) {
        newErrors.password = 'Password must be 8+ chars with letters and numbers';
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    
    try {
      await onLogin(email, password);
      if (!validate()) {
        return;
      }
      
      console.log('Submitting:', { email, password });
  
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
    
  };

  
  return (
    <div className="divForm">
      <form onSubmit={handleSubmit}>
        <input 
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /> 
        <br />
        <input 
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />
        <button 
          type="submit" 
          id="btnLogin"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default LoginForm;