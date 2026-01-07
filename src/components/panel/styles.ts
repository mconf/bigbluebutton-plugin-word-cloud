import styled from 'styled-components';

const smallOnly = 'only screen and (max-width: 40em)';
const fontSizeBase = '1rem';
const mdPaddingY = '.45rem';
const mdPaddingX = '1rem';
const colorPrimary = 'var(--color-primary, #0F70D7)';
const colorGrayLight = 'var(--color-gray-light, #8B9AA8)';
const colorDanger = 'var(--color-danger, #DF2721)';

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

const Description = styled.p`
  text-align: left;
  font-weight: 400;
  font-size: ${fontSizeBase};
  white-space: normal;
  align-self: flex-start;
  justify-self: flex-start;
  color: ${colorGrayLight} !important;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: auto;
  padding-top: 1rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: ${fontSizeBase};
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: white;

  background-color: ${(props) => (props.variant === 'danger' ? colorDanger : colorPrimary)};

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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

const CheckboxContainer = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: ${colorGrayLight};

  &:hover {
    color: ${colorPrimary};
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: ${colorPrimary};
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${colorGrayLight};
  opacity: 0.3;
  margin: 0 0 1rem 0;
  width: 100%;
`;

export default {
  Container,
  Section,
  SectionContent,
  Description,
  ButtonsContainer,
  Button,
  StatusIndicator,
  StatusDot,
  StatusText,
  CheckboxContainer,
  Checkbox,
  Divider,
  colorPrimary,
};
