import store from "store";

export const getLanguage = () => store.get("roomsy-language") || "en-US";
export const setLanguage = value => store.set("roomsy-language", value);

export const getFontSize = () => store.get("roomsy-font-size") || 1;
export const setFontSize = value => store.set("roomsy-font-size", value);

export const getIsTwoColumnLayout = () => store.get("roomsy-is-two-column-layout") || false;
export const setIsTwoColumnLayout = value => store.set("roomsy-is-two-column-layout", value);