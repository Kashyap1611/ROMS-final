import React from "react";
import ReactDOM from "react-dom/client";
import './index.css';
import App from './App';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL;
if (apiUrl) {
  axios.defaults.baseURL = apiUrl;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
