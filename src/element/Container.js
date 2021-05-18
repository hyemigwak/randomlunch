import React from "react";
import styled from "styled-components";

const Container = ({ children }) => {
  return <ContainerBox>{children}</ContainerBox>;
};

const ContainerBox = styled.div`
  width: 1200px;
  box-sizing: border-box;
  margin: 0px auto;
  /* padding: 0px 20px; */
`;

export default Container;