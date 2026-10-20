import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
body {
  background: ${({ theme }) => theme.backgroundColor};
  color: ${({ theme }) => theme.color};
  font-family: "Open Sans Condensed";
  padding: 20px 60px;
  transition: background-color 200ms ease 0s, color 300ms ease 0s;

  @media screen and (max-width: 800px) {
      padding: 10px;
  }
}

a {
  text-decoration: none;
  color: ${({ theme }) => theme.color};
}

* {
  box-sizing: border-box;
}
`;
