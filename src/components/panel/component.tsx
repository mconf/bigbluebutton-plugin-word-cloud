import * as React from 'react';
import { useState } from 'react';
import { PanelProps } from './types';
import Styled from './styles';
import { intlMessages } from '../../intlMessages';

function Panel({
  pluginApi,
  intl,
  isActive,
  currentStartFromNow,
  onStartStop,
}: PanelProps): JSX.Element {
  const { data: currentUser } = pluginApi.useCurrentUser();
  const [startFromNow, setStartFromNow] = useState(currentStartFromNow ?? false);

  const handleStart = () => {
    const payload = {
      message: 'start' as const,
      startFromNow,
    };
    onStartStop(payload);
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

          <Styled.CheckboxContainer disabled={isActive}>
            <Styled.Checkbox
              type="checkbox"
              checked={startFromNow}
              onChange={(e) => setStartFromNow(e.target.checked)}
              disabled={isActive}
            />
            {intl.formatMessage(intlMessages.startFromNow)}
          </Styled.CheckboxContainer>

          <Styled.ButtonsContainer>
            <Styled.Divider />
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
