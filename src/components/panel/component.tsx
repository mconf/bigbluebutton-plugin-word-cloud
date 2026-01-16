import * as React from 'react';
import { useState } from 'react';
import { PanelProps } from './types';
import Styled from './styles';
import { intlMessages } from '../../intlMessages';
import {
  BBButton,
  BBBToggle,
  BBBTypography,
  BBBDivider,
} from 'bbb-ui-components-react';

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
            <BBBTypography variant="default">
              {intl.formatMessage(intlMessages.descriptionAttendee)}
            </BBBTypography>
          </Styled.SectionContent>
        </Styled.Section>
      );
    }

    return (
      <Styled.Section>
        <Styled.SectionContent>
          <BBBTypography variant="default">
            {intl.formatMessage(intlMessages.description)}
          </BBBTypography>

          <Styled.ToggleContainer>
            <BBBToggle
              label={intl.formatMessage(intlMessages.startFromNow)}
              textPosition="right"
              onChange={(
                _: React.ChangeEvent<HTMLInputElement>,
                checked: boolean,
              ) => setStartFromNow(checked)}
              checked={startFromNow}
              disabled={isActive}
              ariaLabel={intl.formatMessage(intlMessages.startFromNow)}
            />
          </Styled.ToggleContainer>

          <Styled.ButtonsContainer>
            <BBBDivider />
            <BBButton
              label={intl.formatMessage(intlMessages.startButton)}
              variant="primary"
              color="default"
              onClick={handleStart}
              disabled={isActive}
            />
            <BBButton
              label={intl.formatMessage(intlMessages.stopButton)}
              variant="primary"
              color="danger"
              onClick={handleStop}
              disabled={!isActive}
            />
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
