import * as React from 'react';
import { PanelProps } from './types';
import Styled from './styles';
import { intlMessages } from '../../intlMessages';

function Panel({
  pluginApi,
  intl,
  isActive,
  onStartStop,
}: PanelProps): JSX.Element {
  const { data: currentUser } = pluginApi.useCurrentUser();

  const handleStart = () => {
    onStartStop({ message: 'start' });
  };

  const handleStop = () => {
    onStartStop({ message: 'stop' });
  };

  const renderModeratorContent = () => {
    const isModeratorOrPresenter = currentUser?.role === 'MODERATOR' || currentUser?.presenter;

    if (!isModeratorOrPresenter) {
      return (
        <Styled.Section>
          <Styled.SectionContent>
            <Styled.Description>
              {intl.formatMessage(intlMessages.descriptionAttendee)}
            </Styled.Description>
          </Styled.SectionContent>
        </Styled.Section>
      );
    }

    return (
      <Styled.Section>
        <Styled.SectionContent>
          <Styled.Description>
            {intl.formatMessage(intlMessages.description)}
          </Styled.Description>

          <Styled.StatusIndicator isActive={isActive}>
            <Styled.StatusDot isActive={isActive} />
            <Styled.StatusText>
              {isActive
                ? intl.formatMessage(intlMessages.statusActive)
                : intl.formatMessage(intlMessages.statusInactive)}
            </Styled.StatusText>
          </Styled.StatusIndicator>

          <Styled.ButtonsContainer>
            <Styled.Button
              variant="primary"
              onClick={handleStart}
              disabled={isActive}
            >
              {intl.formatMessage(intlMessages.startButton)}
            </Styled.Button>
            <Styled.Button
              variant="danger"
              onClick={handleStop}
              disabled={!isActive}
            >
              {intl.formatMessage(intlMessages.stopButton)}
            </Styled.Button>
          </Styled.ButtonsContainer>
        </Styled.SectionContent>
      </Styled.Section>
    );
  };

  return (
    <Styled.Container>
      {renderModeratorContent()}
    </Styled.Container>
  );
}

export default Panel;
