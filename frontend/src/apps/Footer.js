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

const year = new Date().getFullYear();

const Footer = styled(props => (
  <div {...props}>
    Roomsy v{process.env.REACT_APP_VERSION}
    {" | "}
    Copyright © {year} <FooterLink target={"_blank"} href={"https://www.amaranthapp.com?utm_source=roomsy&utm_medium=footer-link"}>Amaranth</FooterLink>
    {" | "}
    <FooterLink href={"https://roomsy.com/legal/terms-and-conditions"}>Terms and Conditions</FooterLink>
    {" | "}
    <FooterLink href={"https://roomsy.com/legal/privacy-policy"}>Privacy policy</FooterLink>
  </div>
))`
  color: #9aa0ac;
  font-size: 14px;
  text-align: center;
`;

export default Footer;
