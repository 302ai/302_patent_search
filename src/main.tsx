import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { Provider } from 'react-redux'
import store from "./store"

import App from './App.tsx'
import './index.css'

import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { ToastContainer } from "react-toastify";
import ScriptLoader from './ScriptLoader.tsx';

import './i18n.js'; // 引入 i18n 配置

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <ToastContainer />
    <Theme>
      <React.StrictMode>
        <ScriptLoader />
        <Router>
          <Routes>
            <Route path="/" element={<App />} />
          </Routes>
        </Router>
      </React.StrictMode>
    </Theme>
  </Provider>,
)
