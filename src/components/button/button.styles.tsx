import styled from "styled-components";
import { SpinnerContainer } from "../spinner/spinner.styles";

// Interim styling to sit with the Tailwind redesign until each page moves over.
export const BaseButton = styled.button`
  align-items: center;
  min-width: 165px;
  width: auto;
  height: 44px;
  letter-spacing: 0.05em;
  padding: 0 20px;
  font-size: 13px;
  white-space: nowrap;
  background-color: var(--foreground);
  color: var(--background);
  text-transform: uppercase;
  font-family: inherit;
  font-weight: 500;
  border: 1px solid var(--foreground);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  &:hover {
    opacity: 0.9;
  }
`;

export const GoogleSignInButton = styled(BaseButton)`
  background-color: #4285f4;
  color: white;
  &:hover {
    background-color: #357ae8;
    border: none;
  }
`;

export const InvertedButton = styled(BaseButton)`
  background-color: var(--background);
  color: var(--foreground);
  &:hover {
    background-color: var(--foreground);
    color: var(--background);
    opacity: 1;
  }
`;

export const ButtonSpinner = styled(SpinnerContainer)`
  width: 30px !important;
  height: 30px !important;
  margin-top: 10px !important;
`;
