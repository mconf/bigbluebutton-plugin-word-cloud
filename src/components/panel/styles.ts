import styled from 'styled-components';

const smallOnly = 'only screen and (max-width: 40em)';
const mdPaddingY = '.45rem';
const mdPaddingX = '1rem';
const colorGrayLight = 'var(--color-gray-light, #8B9AA8)';

const Container = styled.div`
  padding: 0 ${mdPaddingX} ${mdPaddingY} ${mdPaddingX};
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  height: 100%;

  @media ${smallOnly} {
    transform: none !important;
  }
`;

const Section = styled.div`
  padding: .5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const SectionContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0;
  margin-right: auto;
  margin-left: auto;
  width: 100%;
  flex: 1;
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: auto;
  padding-top: 1rem;
`;

const StatusIndicator = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  background-color: ${(props) => (props.isActive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(139, 154, 168, 0.1)')};
  border: 1px solid ${(props) => (props.isActive ? '#4CAF50' : colorGrayLight)};
`;

const StatusDot = styled.span<{ isActive: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${(props) => (props.isActive ? '#4CAF50' : colorGrayLight)};
`;

const StatusText = styled.span`
  font-size: 0.9rem;
  color: ${colorGrayLight};
`;

const ToggleContainer = styled.div`
  margin-top: 1.5rem;
  margin-bottom: 1rem;
`;

export default {
  Container,
  Section,
  SectionContent,
  ButtonsContainer,
  StatusIndicator,
  StatusDot,
  StatusText,
  ToggleContainer,
};
