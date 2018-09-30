import "@babel/polyfill";
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import Router from "./router";
import i18n from "./i18n";
import registerServiceWorker from "./registerServiceWorker";
import "./index.css";
import "./fonts/index.css";

i18n().then(() => {
  ReactDOM.render(<BrowserRouter children={<Router/>}/>, document.querySelector("#root"));
});

registerServiceWorker();
