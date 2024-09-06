import React from 'react';
import styled from 'styled-components';

type TrashIconProps = {
  onClick: () => void;
};

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-left: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledSVG = styled.svg`
  width: 20px;
  height: 20px;
  fill: ${({ theme }) => theme.colors.text?.alternative};
  transition: fill 0.2s ease;

  &:hover {
    fill: ${({ theme }) => theme.colors.error?.default};
  }
`;

export const TrashIcon: React.FC<TrashIconProps> = ({ onClick }) => {
  return (
    <IconButton onClick={onClick} aria-label="Delete">
      <StyledSVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
      </StyledSVG>
    </IconButton>
  );
};
