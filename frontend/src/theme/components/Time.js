import React from "react";
import PropTypes from "prop-types";
import styled, { keyframes } from "styled-components/macro";

const blinkAnimation = keyframes`
  from { opacity: 1 }
  60% { opacity: 1 }
  61% { opacity: 0 }
  to { opacity: 0 }
`;

const TimeSeparator = styled.span`
  animation: ${blinkAnimation} 1s linear 0s infinite alternate;
  ${props => (!props.blinking ? "animation: none;" : "")};
`;

const Time = props => {
  const pad = number => number.toString().padStart(2, "0");

  const hour24h = new Date(props.timestamp).getHours();
  const hour12h = hour24h % 12 || 12;
  const suffix12h = hour24h >= 12 && hour24h < 24 ? "pm" : "am";

  const hour = pad(props.ampm ? hour12h : hour24h);
  const minutes = pad(new Date(props.timestamp).getMinutes());
  const suffix = props.ampm ? suffix12h : "";

  return (
    <span>
      {hour}
      <TimeSeparator blinking={props.blinking}>:</TimeSeparator>
      {minutes}<span style={{ fontSize: props.smallSuffix ? "0.5em" : "1em" }}>{suffix}</span>
    </span>
  );
};

Time.propTypes = {
  blinking: PropTypes.bool,
  ampm: PropTypes.bool,
  smallSuffix: PropTypes.bool,
  timestamp: PropTypes.number
};

export default Time;
