import React, { useEffect, useState } from "react";
import styled from "styled-components/macro";
import { Link } from "react-router-dom";
import queryString from "query-string";

import { Alert, Button, PageLoaded } from "../../theme";
import Logo from "../Logo";
import Footer from "../Footer";
import CardAndFooterLayout from "../../theme/layouts/CardAndFooter";
import { getAuth } from "services/api";

import buttonGoogle from "./logo-google.svg";
import buttonMicrosoft from "./logo-microsoft.svg";
import DriftWidget from "../DriftWidget";

const PageLogo = styled(Logo)`
  margin-bottom: 40px;
  display: block;
`;

const MenuButton = styled(Button)`
  width: calc(100vw - 100px);
  max-width: 300px;
  margin: 20px 0;
  text-decoration: none;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #ccc;
`;

const LogoImg = styled.img`
  margin-right: 10px;
  height: 20px;
  margin-bottom: 2px;
`;

const SimpleLink = ({ to, className, children }) => <Link to={to} className={className} children={children}/>;

export default () => {
  const [authUrl, setAuthUrl] = useState({ google: "/", office365: "/" });

  useEffect(() => {
    getAuth().then(auth => setAuthUrl(auth.authUrl));
  }, []);

  const showOffice365LoginError = queryString.parse(window.location.search).error === "office365_login_error";

  return (
    <CardAndFooterLayout footer={<Footer/>}>
      <PageLoaded/>
      <PageLogo withName size={30}/>
      {showOffice365LoginError && (
        <Alert error style={{ maxWidth: 300 }}>
          <strong>Authentication error</strong><br/>
          Please ensure that you use a school or work Office365 account and try again. <br/>
        </Alert>
      )}
      {authUrl.google && <MenuButton block href={authUrl.google} white>
        <LogoImg alt="Google logo" src={buttonGoogle}/><span>Sign in with Google</span>
      </MenuButton>}
      {authUrl.office365 && <MenuButton block href={authUrl.office365} white>
        <LogoImg alt="Microsoft logo" src={buttonMicrosoft}/><span>Sign in with Microsoft</span>
      </MenuButton>}
      <MenuButton block to={"/device"} white as={SimpleLink}>Register device</MenuButton>
    </CardAndFooterLayout>
  );
};
