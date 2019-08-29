import React from "react";
import styled from "styled-components/macro";

const FooterLink = styled.a`
  color: inherit;
  text-decoration: none;
  white-space: nowrap;

  :hover {
    color: black;
  }
`;

const Footer = styled(props => (
  <div {...props}>
    Roombelt v{process.env.REACT_APP_VERSION}
    {" | "}
    Copyright © 2019 <FooterLink href={"https://szymondukla.com/?utm_source=roombook&utm_medium=footer"}>Szymon Dukla</FooterLink>
    {" | "}
    <FooterLink href={"https://roombook.com/legal/terms-and-conditions"}>Terms and Conditions</FooterLink>
    {" | "}
    <FooterLink href={"https://roombook.com/legal/privacy-policy"}>Privacy policy</FooterLink>
  </div>
))`
  color: #9aa0ac;
  font-size: 14px;
  text-align: center;
`;

export default Footer;
